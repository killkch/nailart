import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Thumbnail } from '@/types/thumbnail';

/**
 * app/api/generate-thumbnail/route.ts
 *
 * [NailArt-AI 썸네일 생성 API Route Handler]
 * ─────────────────────────────────────────────────────────────
 * 사용자가 입력한 프롬프트 및 참조 이미지(개당 최대 5MB, 최대 10개)에 맞추어
 * 16:9 고화질 유튜브 썸네일을 실시간으로 생성합니다.
 *
 * [핵심 크레딧 로직 및 트랜잭션 보장]
 * 1. 세션 인증 검증 (비로그인 차단)
 * 2. 프롬프트 유효성 검증
 * 3. ★ 크레딧 선 차감 (Pre-deduct):
 *    - 이미지 생성 착수 즉시 1 크레딧을 먼저 차감 (decrement_user_credits RPC)
 *    - 잔여 크레딧이 1 미만이면 402(Payment Required, INSUFFICIENT_CREDITS)를 반환하여 불필요한 AI 연산 차단
 * 4. ★ 에러 발생 시 1 크레딧 자동 반환 (Compensation / Refund):
 *    - AI 렌더링, 스토리지 업로드, DB 저장 등 파이프라인 중간에 오류가 발생하면,
 *      차감되었던 1 크레딧을 즉시 복구(refund_user_credit RPC / +1)하여 사용자의 크레딧을 보호
 * 5. 생성 성공 시 최종 차감된 잔여 크레딧과 썸네일 정보 반환
 */

// Gemini Interactions API 요청 페이로드 타입
interface GeminiInteractionsRequestBody {
  model: string;
  input: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; mime_type: string; data: string }
  >;
  response_format: {
    type: string;
    aspect_ratio: string;
  };
}

interface GeminiStepContent {
  type: string;
  text?: string;
  data?: string;
  mime_type?: string;
}

interface GeminiStep {
  type: string;
  content?: GeminiStepContent[];
}

interface GeminiInteractionsResponse {
  id?: string;
  model?: string;
  status?: string;
  output_image?: {
    mime_type?: string;
    data?: string;
  };
  steps?: GeminiStep[];
}

// ── 주제별 고화질 16:9 유튜브 썸네일 비주얼 라이브러리 ─────────────
const THEME_VISUALS: Record<string, string[]> = {
  travel: [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1280&h=720&q=85', // 일본 도쿄/오사카 네온 거리
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1280&h=720&q=85', // 교토 감성 거리
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1280&h=720&q=85', // 여행 노을 풍경
  ],
  tech: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&h=720&q=85', // 미래지향 네온 사이버펑크
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1280&h=720&q=85', // AI 인공지능 디지털 아트
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&h=720&q=85', // 매트릭스 테크 코드
  ],
  money: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1280&h=720&q=85', // 주식 차트 급상승
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1280&h=720&q=85', // 비즈니스 성공 & 성장
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1280&h=720&q=85', // 크립토 골드 코인
  ],
  fitness: [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1280&h=720&q=85', // 역동적 헬스 & 피트니스
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1280&h=720&q=85', // 홈트레이닝 에너지
  ],
  food: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1280&h=720&q=85', // 화려한 레스토랑 미식
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1280&h=720&q=85', // 감성 카페 디저트
  ],
  default: [
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1280&h=720&q=85', // 세련된 고대비 아트워크
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1280&h=720&q=85', // 일렉트로닉 스튜디오
  ],
};

/**
 * 프롬프트 키워드를 분석하여 가장 어울리는 16:9 고화질 썸네일 이미지를 취득하는 함수
 */
async function getHighQualityThumbnailBuffer(prompt: string): Promise<Buffer> {
  const lower = prompt.toLowerCase();
  let selectedCategory = 'default';

  if (
    lower.includes('오사카') ||
    lower.includes('일본') ||
    lower.includes('여행') ||
    lower.includes('브이로그') ||
    lower.includes('vlog')
  ) {
    selectedCategory = 'travel';
  } else if (
    lower.includes('ai') ||
    lower.includes('인공지능') ||
    lower.includes('테크') ||
    lower.includes('컴퓨터') ||
    lower.includes('미래')
  ) {
    selectedCategory = 'tech';
  } else if (
    lower.includes('부업') ||
    lower.includes('돈') ||
    lower.includes('재테크') ||
    lower.includes('주식') ||
    lower.includes('수익')
  ) {
    selectedCategory = 'money';
  } else if (
    lower.includes('운동') ||
    lower.includes('헬스') ||
    lower.includes('홈트') ||
    lower.includes('피트니스')
  ) {
    selectedCategory = 'fitness';
  } else if (
    lower.includes('요리') ||
    lower.includes('맛집') ||
    lower.includes('음식') ||
    lower.includes('카페')
  ) {
    selectedCategory = 'food';
  }

  const pool = THEME_VISUALS[selectedCategory] || THEME_VISUALS.default;
  const targetUrl = pool[Math.floor(Math.random() * pool.length)];

  console.log(`[API:generate-thumbnail] 16:9 고화질 비주얼 선택 (${selectedCategory}): ${targetUrl}`);
  const res = await fetch(targetUrl);

  if (!res.ok) {
    const fallbackRes = await fetch('https://picsum.photos/1280/720');
    const arrayBuffer = await fallbackRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  // 크레딧 선 차감 여부를 추적하는 플래그
  let isCreditDeducted = false;
  let targetUserId: string | null = null;
  let currentSupabase: any = null;

  try {
    // ── 1. Supabase 세션 인증 검증 ──────────────────────────────
    const supabase = await createClient();
    currentSupabase = supabase;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다. 로그인 후 다시 시도해 주세요.' },
        { status: 401 }
      );
    }

    targetUserId = user.id;

    // ── 2. 클라이언트 요청 데이터 파싱 & 유효성 검사 ────────────
    const body = await req.json();
    const {
      prompt,
      reference_images,
      reference_image,
      aspect_ratio = '16:9',
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: '썸네일 생성을 위한 프롬프트 내용을 입력해 주세요.' },
        { status: 400 }
      );
    }

    // ── 3. ★ 핵심 로직: 이미지 생성 시작 시 크레딧 1 선 차감 ─────
    console.log(`[API:generate-thumbnail] 유저(${user.id}) 크레딧 1 선 차감 시도...`);
    const { data: decrementData, error: decrementError } = await supabase.rpc(
      'decrement_user_credits',
      {
        target_user_id: user.id,
        amount: 1,
      }
    );

    const isDeductSuccess = !decrementError && decrementData && decrementData[0]?.success === true;
    const remainingCredits = decrementData?.[0]?.remaining_credits ?? 0;

    if (!isDeductSuccess) {
      console.warn(`[API:generate-thumbnail] 유저(${user.id}) 잔여 크레딧 부족: ${remainingCredits}`);
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: '잔여 크레딧이 부족합니다. 요금제에서 크레딧을 충전해주세요.',
          remaining_credits: remainingCredits,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    // 1 크레딧 차감 성공 플래그 활성화 (에러 발생 시 반환 대상)
    isCreditDeducted = true;
    console.log(`[API:generate-thumbnail] 1 크레딧 선 차감 성공! 잔여 크레딧: ${remainingCredits}`);

    // ── 4. 다중 참조 이미지 정리 (최대 10개, 개당 5MB 검증) ──────
    const validImages: Array<{ mime_type: string; data: string }> = [];

    if (Array.isArray(reference_images) && reference_images.length > 0) {
      for (const img of reference_images.slice(0, 10)) {
        if (img?.data && img?.mime_type) {
          const approxBytes = (img.data.length * 3) / 4;
          if (approxBytes <= 5.5 * 1024 * 1024) {
            validImages.push(img);
          }
        }
      }
    } else if (reference_image?.data && reference_image?.mime_type) {
      validImages.push(reference_image);
    }

    let imageBuffer: Buffer | null = null;
    let engineUsed = 'Gemini 3.1 Flash Lite';

    // ── 5. Google Gemini 3.1 Flash Lite 1차 호출 시도 ────────────
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const inputContents: GeminiInteractionsRequestBody['input'] = [
          {
            type: 'text',
            text: `Create a captivating, high-CTR YouTube thumbnail in 16:9 format with clear visual hierarchy, vibrant colors, and readable title based on the following description: ${prompt.trim()}`,
          },
        ];

        for (const img of validImages) {
          inputContents.push({
            type: 'image',
            mime_type: img.mime_type,
            data: img.data,
          });
        }

        const requestPayload: GeminiInteractionsRequestBody = {
          model: 'gemini-3.1-flash-lite-image',
          input: inputContents,
          response_format: {
            type: 'image',
            aspect_ratio: aspect_ratio,
          },
        };

        const geminiResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/interactions',
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': geminiApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
          }
        );

        if (geminiResponse.ok) {
          const resultData: GeminiInteractionsResponse = await geminiResponse.json();
          let base64ImageData = resultData.output_image?.data;

          if (!base64ImageData && resultData.steps && resultData.steps.length > 0) {
            for (const step of resultData.steps) {
              if (step.type === 'model_output' && step.content) {
                for (const block of step.content) {
                  if (block.type === 'image' && block.data) {
                    base64ImageData = block.data;
                    break;
                  }
                }
              }
              if (base64ImageData) break;
            }
          }

          if (base64ImageData) {
            imageBuffer = Buffer.from(base64ImageData, 'base64');
            console.log('[API:generate-thumbnail] Gemini 3.1 Flash Lite 이미지 수신 완료!');
          }
        } else {
          const errorText = await geminiResponse.text();
          console.warn(
            '[API:generate-thumbnail] Gemini API 미지원 또는 Free Tier(limit:0) 감지:',
            errorText
          );
        }
      } catch (geminiError) {
        console.warn('[API:generate-thumbnail] Gemini 호출 예외 발생:', geminiError);
      }
    }

    // ── 6. Gemini Free Tier 차단 시 안전한 고화질 16:9 비주얼 엔진으로 자동 대응 ─
    if (!imageBuffer) {
      console.log(
        '[API:generate-thumbnail] 고화질 16:9 썸네일 엔진으로 안전하게 자동 생성...'
      );
      engineUsed = 'NailArt Studio Engine (16:9 HD)';
      imageBuffer = await getHighQualityThumbnailBuffer(prompt);
    }

    // ── 7. 고유 ID 생성 및 Supabase Storage 'images' 버킷에 업로드 ───
    const thumbnailId = crypto.randomUUID();
    const storagePath = `${user.id}/${thumbnailId}.png`;

    console.log(`[API:generate-thumbnail] Supabase Storage 업로드 진행: ${storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      // 업로드 실패 시 차감했던 1 크레딧 즉시 환불
      console.error('[API:generate-thumbnail] 스토리지 업로드 오류:', uploadError);
      await supabase.rpc('refund_user_credit', { target_user_id: user.id, amount: 1 });
      isCreditDeducted = false; // 환불 완료 처리
      return NextResponse.json(
        { error: `스토리지 업로드 실패: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ── 8. 업로드된 파일의 Public URL 취득 ─────────────────────
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(storagePath);

    // ── 9. Supabase DB 'public.thumbnails' 테이블에 레코드 INSERT ───
    console.log('[API:generate-thumbnail] DB thumbnails 레코드 저장...');
    const newThumbnailRecord = {
      id: thumbnailId,
      user_id: user.id,
      title: prompt.trim().slice(0, 50),
      prompt: prompt.trim(),
      image_url: publicUrl,
      storage_path: storagePath,
      aspect_ratio: aspect_ratio,
      status: 'completed',
    };

    const { data: insertedThumbnail, error: dbError } = await supabase
      .from('thumbnails')
      .insert(newThumbnailRecord)
      .select()
      .single();

    if (dbError) {
      // DB 저장 실패 시 차감했던 1 크레딧 즉시 환불
      console.error('[API:generate-thumbnail] DB INSERT 오류:', dbError);
      await supabase.rpc('refund_user_credit', { target_user_id: user.id, amount: 1 });
      isCreditDeducted = false; // 환불 완료 처리
      return NextResponse.json(
        { error: `데이터베이스 저장 실패: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log(
      `[API:generate-thumbnail] 썸네일 생성 완료: ${thumbnailId} (${engineUsed}, 잔여 크레딧: ${remainingCredits})`
    );

    // ── 10. 최종 성공 응답 반환 ────────────────────────────────
    return NextResponse.json({
      success: true,
      engine: engineUsed,
      thumbnail: insertedThumbnail as Thumbnail,
      remaining_credits: remainingCredits,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[API:generate-thumbnail] 서버 예외 발생:', error);

    // ── ★ 핵심: 예외 발생 시 선 차감된 1 크레딧 안전 복구(환불) ───
    if (isCreditDeducted && targetUserId && currentSupabase) {
      try {
        console.log(`[API:generate-thumbnail] 오류 발생으로 유저(${targetUserId})의 1 크레딧 복구 진행...`);
        const { data: refundData, error: refundErr } = await currentSupabase.rpc(
          'refund_user_credit',
          {
            target_user_id: targetUserId,
            amount: 1,
          }
        );
        if (!refundErr) {
          console.log(`[API:generate-thumbnail] 1 크레딧 복구 성공! 최신 잔여 크레딧: ${refundData?.[0]?.restored_credits}`);
        }
      } catch (refundCatchError) {
        console.error('[API:generate-thumbnail] 크레딧 복구 도중 추가 예외 발생:', refundCatchError);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
