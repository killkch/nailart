/**
 * lib/supabase/server.ts
 *
 * 서버 컴포넌트 / Route Handler / Server Action에서 사용하는 Supabase 클라이언트
 * Next.js의 cookies()를 통해 세션을 관리합니다.
 *
 * 사용 예시 (Server Component):
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // Next.js 15+ 에서는 cookies()가 async입니다
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 쿠키 읽기
        getAll() {
          return cookieStore.getAll();
        },
        // 쿠키 쓰기 (Server Component에서는 실제로 쓸 수 없으므로 Route Handler에서 사용)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 무시 (읽기 전용)
          }
        },
      },
    },
  );
}
