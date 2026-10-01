-- ============================================================
-- 007_create_refund_credit_function.sql
--
-- 이미지 생성 실패 시 차감되었던 크레딧(기본 1개)을 즉시 복구/반환하는 원자적(Atomic) 데이터베이스 함수
-- ────────────────────────────────────────────────────────────
-- 1. 이미지 생성 중 AI 에러, 네트워크 오류, 스토리지 업로드 실패 등의
--    예외가 발생했을 때 호출되어 차감된 1 크레딧을 즉시 원상 복구(+1)합니다.
-- 2. 원자적 연산을 통해 동시 요청 상황에서도 크레딧 유실이나 왜곡이 발생하지 않습니다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.refund_user_credit(
  target_user_id UUID,
  amount         INTEGER DEFAULT 1
)
RETURNS TABLE (
  success           BOOLEAN,
  restored_credits  INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  -- 대상 유저의 크레딧을 즉시 amount만큼 증액 복구
  UPDATE public.users
  SET 
    credits = public.users.credits + amount,
    updated_at = NOW()
  WHERE public.users.id = target_user_id
  RETURNING public.users.credits INTO new_credits;

  -- 갱신된 행이 없으면 실패 반환
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- 복구 성공 및 최신 잔여 크레딧 반환
  RETURN QUERY SELECT TRUE, new_credits;
END;
$$;

-- 보안 설정: authenticated(인증된 사용자) 및 service_role(백엔드 관리자) 권한 부여
REVOKE ALL ON FUNCTION public.refund_user_credit(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_user_credit(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_user_credit(UUID, INTEGER) TO service_role;
