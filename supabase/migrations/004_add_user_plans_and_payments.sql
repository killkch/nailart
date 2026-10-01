-- ============================================================
-- 004_add_user_plans_and_payments.sql
--
-- 1. public.users 테이블에 요금제 및 크레딧 관리 컬럼 추가
--    - plan: 사용자 플랜 (기본값 'free')
--    - subscription_status: 이용 상태 (기본값 'inactive')
--    - credits: AI 썸네일 생성 잔여 크레딧 (기본값 0)
--
-- 2. public.payments 결제 기록 테이블 신규 생성 (최소 필수 필드)
--    - id, user_id, amount, currency, status, plan, credits_added, polar_checkout_id, created_at
--
-- 3. payments 테이블에 대한 RLS(행 단위 보안) 정책 설정
--    - 사용자는 본인의 결제 내역만 SELECT 가능
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. public.users 테이블에 신규 컬럼 추가
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. auth.users → public.users 자동 동기화 트리거 함수 업데이트
--    (신규 가입자에게 기본 plan='free', subscription_status='inactive', credits=0 자동 부여)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    plan,
    subscription_status,
    credits
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    'free',
    'inactive',
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. public.payments 테이블 생성 (최소 필수 필드 구성)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  -- 결제 고유 번호 (UUID)
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 결제한 사용자 (public.users 외래키 연동, 유저 삭제 시 결제 기록도 정리)
  user_id           UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 결제 금액 (원화 기준, 예: 20000, 40000)
  amount            INTEGER      NOT NULL,
  
  -- 결제 통화 (기본값 'KRW')
  currency          TEXT         DEFAULT 'KRW',
  
  -- 결제 처리 상태 ('pending': 결제 대기, 'succeeded': 완료, 'failed': 실패)
  status            TEXT         NOT NULL DEFAULT 'pending',
  
  -- 결제한 요금제 플랜 ('pro', 'ultra')
  plan              TEXT         NOT NULL,
  
  -- 이번 결제로 지급될/지급된 크레딧 수 (100, 300)
  credits_added     INTEGER      NOT NULL,
  
  -- Polar 결제 세션 식별 고유 ID (웹훅 및 주문 조회용)
  polar_checkout_id TEXT,
  
  -- 결제 생성 일시
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- 검색 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_polar_checkout_id ON public.payments(polar_checkout_id);

-- ────────────────────────────────────────────────────────────
-- 4. RLS(Row Level Security) 활성화 및 보안 정책 설정
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 기존 동일 이름의 정책이 있다면 충돌 방지를 위해 삭제 후 재생성
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;

-- 로그인된 사용자(authenticated)는 오직 자신의 결제 내역만 조회(SELECT) 가능
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- 결제 생성(INSERT) 및 수정(UPDATE)은 보안을 위해 일반 클라이언트에게 허용하지 않고,
-- 서버 사이드 Service Role(웹훅 및 결제 처리 백엔드)에서만 수행하도록 제한합니다.
