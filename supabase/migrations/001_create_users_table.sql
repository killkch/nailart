-- ============================================================
-- 001_create_users_table.sql
--
-- public.users 테이블 생성 및 auth.users 자동 동기화 트리거
-- 
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣고 Run
--   또는: supabase db query --file supabase/migrations/001_create_users_table.sql
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. public.users 테이블 생성
--    auth.users 와 1:1로 연동되는 사용자 프로필 테이블
--    id: auth.users의 UUID를 참조 (CASCADE DELETE)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  provider    TEXT        DEFAULT 'google',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. RLS(Row Level Security) 활성화
--    RLS가 없으면 anon/authenticated 모두 모든 행에 접근 가능
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 3. RLS 정책: 로그인한 사용자는 자신의 행만 조회 가능
--    auth.uid() = id 조건으로 본인 데이터만 읽기 허용
-- ────────────────────────────────────────────────────────────
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING ( (SELECT auth.uid()) = id );

-- ────────────────────────────────────────────────────────────
-- 4. RLS 정책: 로그인한 사용자는 자신의 행만 수정 가능
--    USING + WITH CHECK 모두 설정 (reassignment 공격 방지)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING ( (SELECT auth.uid()) = id )
  WITH CHECK ( (SELECT auth.uid()) = id );

-- ────────────────────────────────────────────────────────────
-- 5. updated_at 자동 갱신 함수
--    users 행이 UPDATE될 때마다 updated_at을 현재 시간으로 갱신
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- updated_at 트리거 등록
CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 6. auth.users → public.users 자동 동기화 트리거 함수
--
--    Google OAuth 로그인 시 Supabase는 auth.users에 신규 행을 삽입합니다.
--    이 트리거 함수는 그 순간 자동으로 public.users에도 동일한 사용자를 삽입합니다.
--
--    raw_user_meta_data: 구글이 제공하는 이름, 아바타 등 메타데이터
--    raw_app_meta_data:  provider 정보 (google, github 등)
--
--    보안:
--    - SECURITY INVOKER: 호출자의 권한으로 실행 (DEFINER보다 안전)
--    - SET search_path = '': search_path 주입 공격 방지
--    - ON CONFLICT DO NOTHING: 중복 삽입 무시 (멱등성 보장)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 7. auth.users에 새 행이 INSERT될 때 트리거 실행
--    (신규 Google 로그인 → 자동으로 public.users에 저장)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
