import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@/lib/supabase/server';

/**
 * app/api/portal/route.ts
 *
 * Polar 고객 포털(Customer Portal) 세션 발급 API 엔드포인트
 * ─────────────────────────────────────────────────────────────
 * [주요 동작 및 비즈니스 로직]
 * 1. 인증된 사용자 확인:
 *    - Supabase Auth 세션 쿠키를 통해 현재 로그인한 사용자를 식별합니다.
 *
 * 2. Polar Customer Session 생성:
 *    - Polar SDK의 customerSessions.create API를 호출하여
 *      해당 고객 전용 단기 인증 토큰 및 Customer Portal URL(customerPortalUrl)을 발급받습니다.
 *    - 사용자의 externalCustomerId(Supabase user.id)를 우선 매핑하고,
 *      필요 시 이메일을 통한 고객 조회를 폴백으로 지원합니다.
 *
 * 3. 안전한 반환 URL 설정:
 *    - 포털 내에서 작업을 마친 뒤 다시 돌아올 URL을 /dashboard 로 지정합니다.
 *
 * 4. 결과 반환:
 *    - 발급된 customerPortalUrl을 클라이언트에 전달하여 고객이 구독 해지/카드 변경/인보이스 조회를 할 수 있도록 합니다.
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Supabase 세션에서 현재 로그인된 유저 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 2. 환경변수 확인
    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'POLAR_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const envServer = process.env.POLAR_SERVER?.toLowerCase() as 'sandbox' | 'production' | undefined;
    const server: 'sandbox' | 'production' = envServer === 'production' ? 'production' : 'sandbox';

    const polar = new Polar({
      accessToken,
      server,
    });

    const origin = request.nextUrl.origin;
    const returnUrl = `${origin}/dashboard`;

    let sessionUrl: string | null = null;

    // 3. Polar Customer Session 생성 시도
    try {
      // (1) externalCustomerId(Supabase user.id)로 세션 생성 시도
      const session = await polar.customerSessions.create({
        externalCustomerId: user.id,
        returnUrl,
      });

      if (session?.customerPortalUrl) {
        sessionUrl = session.customerPortalUrl;
      }
    } catch (primaryError: any) {
      console.warn(
        '[Polar Portal] externalCustomerId로 세션 생성 실패, 이메일로 고객 검색 시도:',
        primaryError?.message || primaryError
      );

      // (2) externalCustomerId 매핑이 안 되어 있는 경우, 이메일로 Polar 고객 조회 후 customerId로 재시도
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
              sessionUrl = fallbackSession.customerPortalUrl;
            }
          }
        } catch (fallbackError) {
          console.error('[Polar Portal] 이메일 고객 검색 폴백 실패:', fallbackError);
        }
      }
    }

    // 4. 세션 URL 발급 실패 시 환경별 기본 포털 URL 안내 폴백
    if (!sessionUrl) {
      // 일반 공개 포털 URL 안내
      sessionUrl =
        server === 'sandbox'
          ? 'https://sandbox.polar.sh/portal'
          : 'https://polar.sh/portal';
    }

    return NextResponse.json({
      success: true,
      url: sessionUrl,
    });
  } catch (error: any) {
    console.error('[Polar Portal] 고객 포털 세션 생성 오류:', error);
    return NextResponse.json(
      {
        error:
          error?.body?.error_description ||
          error?.message ||
          '구독 관리 포털로 이동하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
