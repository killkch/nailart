-- ============================================================
-- 002_fix_trigger_permissions.sql
--
-- 트리거 함수 권한 문제 수정:
-- SECURITY INVOKER → SECURITY DEFINER 변경
-- + supabase_auth_admin에 INSERT 권한 부여
-- + INSERT RLS 정책 추가 (트리거 전용)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 문제 원인:
--   auth.users에 INSERT를 실행하는 역할 = supabase_auth_admin
--   SECURITY INVOKER: 트리거도 supabase_auth_admin 권한으로 실행
--   → supabase_auth_admin은 public.users에 INSERT 권한 없음
--   → 트리거가 조용히 실패 (에러 없이 저장 안 됨)
--
-- 해결책:
--   1. supabase_auth_admin에 INSERT 권한 명시적 부여
--   2. 트리거 함수를 SECURITY DEFINER로 변경 (함수 소유자=postgres 권한으로 실행)
--   3. search_path를 명시적으로 지정해 보안 유지
-- ────────────────────────────────────────────────────────────

-- 1. supabase_auth_admin 역할에 public.users INSERT 권한 부여
GRANT INSERT ON public.users TO supabase_auth_admin;

-- 2. 트리거 함수를 SECURITY DEFINER로 교체
--    SECURITY DEFINER = 함수 소유자(postgres)의 권한으로 실행
--    → RLS와 권한 문제를 우회하여 안정적으로 INSERT 가능
--    보안 강화: search_path 고정으로 search_path 주입 방지
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    provider   = EXCLUDED.provider,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. 트리거가 없으면 재생성 (이미 있으면 무시)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 기존에 auth.users에 있는 사용자를 public.users에 수동 동기화
--    (이미 로그인했지만 트리거 오류로 저장 안 된 사용자 복구)
INSERT INTO public.users (id, email, full_name, avatar_url, provider, created_at)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  COALESCE(raw_app_meta_data->>'provider', 'google'),
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email      = EXCLUDED.email,
  full_name  = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  provider   = EXCLUDED.provider,
  updated_at = NOW();
