/**
 * lib/supabase/client.ts
 *
 * 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트
 * 'use client' 컴포넌트에서 import해서 사용하세요.
 *
 * 사용 예시:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *   const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // 환경변수에서 Supabase URL과 Anon Key를 읽어옵니다
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
