-- ============================================================
-- 005_create_increment_credits_function.sql
--
-- 사용자 크레딧 증액 및 요금제 갱신을 위한 원자적(Atomic) 데이터베이스 함수
-- ────────────────────────────────────────────────────────────
-- 동시 결제나 다중 요청 상황에서도 크레딧이 유실되지 않고 안전하게
-- 더해지도록(credits = credits + add_amount) 처리합니다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_user_credits(
  target_user_id UUID,
  add_amount     INTEGER,
  new_plan       TEXT
)
RETURNS TABLE (
  updated_id      UUID,
  updated_credits INTEGER,
  updated_plan    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.users
  SET 
    credits = public.users.credits + add_amount,
    plan = new_plan,
    subscription_status = 'active',
    updated_at = NOW()
  WHERE public.users.id = target_user_id
  RETURNING 
    public.users.id,
    public.users.credits,
    public.users.plan;
END;
$$;

-- 보안: authenticated 및 service_role 권한 부여
REVOKE ALL ON FUNCTION public.increment_user_credits(UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_credits(UUID, INTEGER, TEXT) TO service_role;
