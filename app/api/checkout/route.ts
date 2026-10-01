import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@/lib/supabase/server';

/**
 * app/api/checkout/route.ts
 *
 * Polar Checkout Session 생성 API 라우트 핸들러
 * ─────────────────────────────────────────────────────────────
 * [주요 동작 및 보안 원칙]
 * 1. 보안 최우선:
 *    - Polar Access Token은 비밀 키이므로 프론트엔드가 아닌 본 서버 엔드포인트에서만 안전하게 사용됩니다.
 *
 * 2. 샌드박스(Sandbox) / 프로덕션(Production) 자동 감지 및 스마트 폴백:
 *    - 개발 및 테스트 단계에서는 sandbox 환경(https://sandbox.polar.sh) 토큰이 사용됩니다.
 *    - POLAR_SERVER 환경변수가 있으면 해당 서버를 우선 사용하고,
 *      설정되지 않았거나 invalid_token(401) 에러가 발생하는 경우 sandbox/production 간 자동 폴백을 시도하여
 *      어떤 환경의 토큰이든 완벽하게 결제 세션이 생성되도록 보장합니다.
 *
 * 3. 현재 로그인 사용자 연동:
 *    - Supabase Auth 세션 쿠키를 검증하여 로그인된 사용자의 ID와 Email을 추출합니다.
 *    - 추출한 정보를 Polar의 `externalCustomerId` 및 `customerEmail`로 전달하여
 *      결제 내역이 해당 유저 계정에 정확히 연동되도록 합니다.
 *
 * 4. 결과 반환:
 *    - 생성된 결제 세션 URL(`checkout.url`)에 다크모드 테마(`?theme=dark`)를 적용하여 클라이언트에 응답합니다.
 */

// 단일 서버 환경에서 결제 세션 생성을 시도하는 헬퍼 함수
async function createCheckoutSession({
  accessToken,
  server,
  productId,
  userId,
  userEmail,
  customerIp,
  successUrl,
  returnUrl,
}: {
  accessToken: string;
  server: 'sandbox' | 'production';
  productId: string;
  userId?: string;
  userEmail?: string;
  customerIp?: string;
  successUrl: string;
  returnUrl: string;
}) {
  const polar = new Polar({
    accessToken: accessToken,
    server: server,
  });

  return await polar.checkouts.create({
    products: [productId],
    externalCustomerId: userId,
    customerEmail: userEmail,
    customerIpAddress: customerIp,
    successUrl: successUrl,
    returnUrl: returnUrl,
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디에서 선택한 요금제 플랜(pro 또는 ultra) 파싱
    const body = await request.json();
    const { plan } = body as { plan?: 'pro' | 'ultra' };

    if (!plan || (plan !== 'pro' && plan !== 'ultra')) {
      return NextResponse.json(
        { error: '올바른 요금제 플랜(pro 또는 ultra)을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 2. 환경변수 확인 (다양한 환경변수 네이밍 유연 지원)
    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
    const proProductId = (
      process.env.POLAR_PRO_PRODUCT_ID ||
      process.env.POLAR_PRODUCT_ID_PRO ||
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO
    )?.trim();
    const ultraProductId = (
      process.env.POLAR_ULTRA_PRODUCT_ID ||
      process.env.POLAR_PRODUCT_ID_ULTRA ||
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ULTRA
    )?.trim();

    // 필수 환경변수 누락 시 안내 메시지 반환
    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            'POLAR_ACCESS_TOKEN 환경변수가 설정되지 않았습니다. .env.local 파일에 설정되어 있는지 확인해주세요.',
        },
        { status: 500 }
      );
    }

    const targetProductId = plan === 'pro' ? proProductId : ultraProductId;

    if (!targetProductId) {
      const missingKey = plan === 'pro' ? 'POLAR_PRO_PRODUCT_ID' : 'POLAR_ULTRA_PRODUCT_ID';
      return NextResponse.json(
        {
          error: `${missingKey} 상품 ID 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.`,
        },
        { status: 500 }
      );
    }

    // 3. Supabase 세션에서 현재 로그인된 사용자 정보 조회
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 4. 클라이언트 접속 IP 추출 (국가 및 세금 계산용)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const customerIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;

    // 5. 리다이렉트 성공 URL 및 취소/뒤로가기 URL 구성
    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/dashboard?checkout=success&session_id={CHECKOUT_ID}`;
    const returnUrl = `${origin}/dashboard`;

    // 6. Polar 서버 환경 결정 (기본값: sandbox 테스트 환경)
    const envServer = process.env.POLAR_SERVER?.toLowerCase() as 'sandbox' | 'production' | undefined;
    const initialServer: 'sandbox' | 'production' =
      envServer === 'production' ? 'production' : 'sandbox';

    let checkout;
    try {
      // 1차 시도
      checkout = await createCheckoutSession({
        accessToken,
        server: initialServer,
        productId: targetProductId,
        userId: user?.id,
        userEmail: user?.email,
        customerIp,
        successUrl,
        returnUrl,
      });
    } catch (primaryError: any) {
      // 만약 invalid_token 에러가 발생한 경우 반대 서버(sandbox <-> production)로 스마트 재시도
      const isTokenError =
        primaryError?.status === 401 ||
        JSON.stringify(primaryError).includes('invalid_token') ||
        primaryError?.message?.includes('invalid_token');

      if (isTokenError) {
        const fallbackServer: 'sandbox' | 'production' =
          initialServer === 'sandbox' ? 'production' : 'sandbox';

        console.warn(
          `[Polar] ${initialServer} 환경에서 토큰 인증 실패. ${fallbackServer} 환경으로 재시도합니다...`
        );

        checkout = await createCheckoutSession({
          accessToken,
          server: fallbackServer,
          productId: targetProductId,
          userId: user?.id,
          userEmail: user?.email,
          customerIp,
          successUrl,
          returnUrl,
        });
      } else {
        throw primaryError;
      }
    }

    if (!checkout || !checkout.url) {
      throw new Error('Polar 결제 세션 URL을 발급받지 못했습니다.');
    }

    // 우리 서비스의 세련된 다크 테마와 어울리도록 결제창 테마를 다크로 지정
    const checkoutUrl = new URL(checkout.url);
    checkoutUrl.searchParams.set('theme', 'dark');

    // 7. 클라이언트로 생성된 결제 페이지 URL 반환
    return NextResponse.json({
      success: true,
      url: checkoutUrl.toString(),
    });
  } catch (error: any) {
    console.error('Polar 결제 세션 생성 실패:', error);
    return NextResponse.json(
      {
        error:
          error?.body?.error_description ||
          error?.message ||
          '결제 세션을 생성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
