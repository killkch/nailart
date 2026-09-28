/**
 * app/auth/callback/route.ts
 *
 * OAuth Callback Route Handler
 * ─────────────────────────────────────────────────────────────
 * 구글 로그인 완료 후 Supabase가 이 URL로 리디렉션합니다:
 *   https://<your-domain>/auth/callback?code=<one-time-code>
 *
 * 이 핸들러가 하는 일:
 *   1. URL에서 `code` 파라미터를 추출
 *   2. exchangeCodeForSession()으로 code를 세션(JWT)으로 교환
 *   3. 홈(/) 또는 원래 가려던 페이지로 리디렉션
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase가 콜백 URL에 붙여주는 일회용 인증 코드
  const code = searchParams.get('code');

  // 로그인 성공 후 이동할 페이지 (기본값: 대시보드)
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Next.js 15+ 에서는 cookies()가 async
    const cookieStore = await cookies();

    // 서버 클라이언트 생성 (쿠키 읽기/쓰기 가능)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    // code → 세션(JWT) 교환. 이 과정에서 쿠키에 세션이 저장됩니다.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 성공: 대시보드 또는 next 파라미터 페이지로 이동
      return NextResponse.redirect(`${origin}${next}`);
    }

    // 오류 발생 시 로그에 남기고 에러 페이지로 이동
    console.error('[Auth Callback] exchangeCodeForSession error:', error.message);
  }

  // code가 없거나 교환 실패 시 에러 파라미터를 포함해 홈으로 이동
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
