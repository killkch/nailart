/**
 * lib/supabase/admin.ts
 *
 * Supabase 관리자(Service Role) 클라이언트
 * ─────────────────────────────────────────────────────────────
 * [보안 주의사항]
 * 1. SUPABASE_SERVICE_ROLE_KEY는 RLS를 우회하는 최고 권한의 키입니다.
 * 2. 절대 클라이언트(브라우저)에 노출되어서는 안 되며, 오직 웹훅(Webhook)이나
 *    서버 백엔드 엔드포인트에서만 제한적으로 사용해야 합니다.
 */

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
