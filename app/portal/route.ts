import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@/lib/supabase/server';

/**
 * app/portal/route.ts
 *
 * Polar 공식 문서 권장: Pre-authenticated Customer Portal Route Handler
 * ─────────────────────────────────────────────────────────────
 * [Polar 공식 가이드 준수]
 * "Point a link in your app at /portal and your customer is one click away from managing their billing."
 *
 * 1. 동작 흐름:
 *    - 사용자가 프론트엔드에서 `/portal` 링크를 클릭하면 이 GET 엔드포인트가 호출됩니다.
 *    - Supabase Auth를 통해 현재 로그인된 유저 세션을 확인합니다. (비로그인 시 /auth 로 리다이렉트)
 *    - Polar SDK의 `customerSessions.create`를 호출하여 단기 인증된 고객 포털 URL(`customerPortalUrl`)을 발급받습니다.
 *    - 해당 포털 URL로 즉시 303 Redirect를 수행하여, 고객이 이메일 인증 코드 입력 없이 바로 포털로 진입합니다.
 *
 * 2. 고객 포털에서 제공하는 자체 기능 (Polar 호스팅):
 *    - 활성 구독 확인 및 플랜 변경/취소 (Self-service cancellations)
 *    - 기본 결제 수단(카드) 변경 및 실패한 결제 복구 (Failed payment recovery)
 *    - 결제 영수증 및 인보이스(PDF) 다운로드 및 정보 수정
 *    - 혜택(Benefits) 확인 및 포털 작업 완료 후 /dashboard 로 복귀
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Supabase 로그인 유저 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 로그인이 되어 있지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', '/dashboard');
      return NextResponse.redirect(loginUrl);
    }

    // 2. Polar 환경설정 로드
    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      console.error('[Polar Portal] POLAR_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.');
      return NextResponse.redirect(new URL('/dashboard?error=polar_config_missing', request.url));
    }

    const envServer = process.env.POLAR_SERVER?.toLowerCase() as 'sandbox' | 'production' | undefined;
    const server: 'sandbox' | 'production' = envServer === 'production' ? 'production' : 'sandbox';

    const polar = new Polar({
      accessToken,
      server,
    });

    const origin = request.nextUrl.origin;
    const returnUrl = `${origin}/dashboard`;

    let customerPortalUrl: string | null = null;

    // 3. Polar Customer Session 생성 시도
    try {
      // (방법 1) Supabase user.id를 externalCustomerId로 매핑하여 고객 세션 생성
      const session = await polar.customerSessions.create({
        externalCustomerId: user.id,
        returnUrl,
      });

      if (session?.customerPortalUrl) {
        customerPortalUrl = session.customerPortalUrl;
      }
    } catch (primaryError: any) {
      console.warn(
        '[Polar Portal] externalCustomerId 세션 생성 실패, 이메일로 고객 검색 시도:',
        primaryError?.message || primaryError
      );

      // (방법 2) externalCustomerId 매핑이 아직 안 된 경우, 고객 이메일로 Polar Customer 검색 후 customerId로 생성
      if (user.email) {
        try {
          const customersList = await polar.customers.list({
            email: user.email,
            limit: 1,
          });

          const polarCustomer = customersList.result?.items?.[0];
          if (polarCustomer?.id) {
            const fallbackSession = await polar.customerSessions.create({
              customerId: polarCustomer.id,
              returnUrl,
            });

            if (fallbackSession?.customerPortalUrl) {
              customerPortalUrl = fallbackSession.customerPortalUrl;
            }
          }
        } catch (fallbackError) {
          console.error('[Polar Portal] 이메일 고객 검색 폴백 실패:', fallbackError);
        }
      }
    }

    // 4. 인증 세션 생성에 실패한 경우, 환경별 기본 Polar 포털 페이지로 폴백
    if (!customerPortalUrl) {
      customerPortalUrl =
        server === 'sandbox'
          ? 'https://sandbox.polar.sh/portal'
          : 'https://polar.sh/portal';
    }

    // 5. Polar 고객 포털 URL로 즉시 303 Redirect 수행
    return NextResponse.redirect(customerPortalUrl, 303);
  } catch (error: any) {
    console.error('[Polar Portal] 치명적 오류 발생:', error);
    return NextResponse.redirect(new URL('/dashboard?error=portal_redirect_failed', request.url));
  }
}
