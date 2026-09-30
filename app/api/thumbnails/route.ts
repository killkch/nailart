import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Thumbnail } from '@/types/thumbnail';

/**
 * app/api/thumbnails/route.ts
 *
 * [로그인한 사용자의 썸네일 목록 조회 API]
 * ─────────────────────────────────────────────────────────────
 * 사용자가 생성한 썸네일 목록을 최신순으로 가져옵니다.
 * Supabase의 RLS 정책 및 서버 세션 검증을 통해 본인의 썸네일만 안전하게 반환합니다.
 */

export async function GET() {
  try {
    const supabase = await createClient();

    // 세션 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 최신 생성순으로 썸네일 목록 조회
    const { data: thumbnails, error: dbError } = await supabase
      .from('thumbnails')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[API:thumbnails] 조회 오류:', dbError);
      return NextResponse.json(
        { error: `썸네일 목록 조회 실패: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thumbnails: (thumbnails || []) as Thumbnail[],
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
