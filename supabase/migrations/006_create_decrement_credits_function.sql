-- ============================================================
-- 006_create_decrement_credits_function.sql
--
-- 사용자 크레딧 1회 차감을 위한 안전한 원자적(Atomic) 데이터베이스 함수
-- ────────────────────────────────────────────────────────────
-- 1. 잔여 크레딧이 요구량(기본 1개)보다 부족할 경우 차감하지 않고
--    success = false 및 현재 잔여량을 반환합니다.
-- 2. FOR UPDATE 행 잠금을 통해 다중 요청에서도 마이너스 크레딧이
--    발생하지 않도록 안전하게 보호합니다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_user_credits(
  target_user_id UUID,
  amount         INTEGER DEFAULT 1
)
RETURNS TABLE (
  success           BOOLEAN,
  remaining_credits INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  curr_credits INTEGER;
BEGIN
  -- 행 잠금과 함께 현재 크레딧 조회
  SELECT public.users.credits INTO curr_credits
  FROM public.users
  WHERE public.users.id = target_user_id
  FOR UPDATE;

  -- 유저가 없거나 크레딧이 부족한 경우 실패 처리
  IF curr_credits IS NULL OR curr_credits < amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(curr_credits, 0);
    RETURN;
  END IF;

  -- 안전한 1크레딧 차감
  UPDATE public.users
  SET 
    credits = public.users.credits - amount,
    updated_at = NOW()
  WHERE public.users.id = target_user_id;

  -- 성공 및 차감 후 잔여 크레딧 반환
  RETURN QUERY SELECT TRUE, curr_credits - amount;
END;
$$;

-- 보안: authenticated 및 service_role 권한 부여
REVOKE ALL ON FUNCTION public.decrement_user_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_user_credits(UUID, INTEGER) TO service_role;
