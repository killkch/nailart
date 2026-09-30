-- ============================================================
-- 003_create_thumbnails_and_storage.sql
--
-- 1. public.thumbnails 테이블 생성 (AI 썸네일 메타데이터 저장)
-- 2. Row Level Security (RLS) 정책 설정 (사용자별 보안 격리)
-- 3. images 스토리지 버킷 생성 및 스토리지 접근 정책 설정
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣고 Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. public.thumbnails 테이블 생성
--    사용자가 생성한 유튜브 썸네일 이미지의 정보를 저장합니다.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.thumbnails (
  -- 썸네일 고유 ID (UUID 형식, 기본값으로 자동 생성)
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 썸네일을 생성한 사용자 ID (public.users 테이블 참조, 회원 탈퇴 시 자동 삭제)
  user_id       UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 썸네일 제목 (영상 제목이나 프로젝트 이름)
  title         TEXT,

  -- AI 썸네일 생성에 사용된 원본 프롬프트 내용
  prompt        TEXT          NOT NULL,

  -- 스토리지에 저장된 실제 이미지 파일의 공개 접근 URL
  image_url     TEXT          NOT NULL,

  -- 스토리지 버킷 내 상대 경로 (예: user_id/thumbnail_id.png)
  storage_path  TEXT          NOT NULL,

  -- 썸네일 화면 비율 (기본값: 유튜브 표준 16:9)
  aspect_ratio  TEXT          DEFAULT '16:9',

  -- 생성 상태 (completed: 완료, pending: 진행중, failed: 실패)
  status        TEXT          DEFAULT 'completed',

  -- 레코드 생성 일시 (기본값: 현재 시각)
  created_at    TIMESTAMPTZ   DEFAULT NOW(),

  -- 레코드 최종 수정 일시 (기본값: 현재 시각)
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. 성능 최적화를 위한 인덱스(Index) 생성
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_thumbnails_user_id 
  ON public.thumbnails(user_id);

CREATE INDEX IF NOT EXISTS idx_thumbnails_created_at 
  ON public.thumbnails(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 3. updated_at 자동 갱신 트리거 설정
-- ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS thumbnails_updated_at ON public.thumbnails;

CREATE TRIGGER thumbnails_updated_at
  BEFORE UPDATE ON public.thumbnails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. RLS(Row Level Security: 행 단위 보안) 활성화 및 정책 수립
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.thumbnails ENABLE ROW LEVEL SECURITY;

-- 4-1. 조회(SELECT) 정책: 로그인한 사용자는 본인이 생성한 썸네일만 조회 가능
DROP POLICY IF EXISTS "thumbnails_select_own" ON public.thumbnails;
CREATE POLICY "thumbnails_select_own" ON public.thumbnails
  FOR SELECT TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- 4-2. 등록(INSERT) 정책: 로그인한 사용자는 오직 자신의 user_id로만 썸네일 등록 가능
DROP POLICY IF EXISTS "thumbnails_insert_own" ON public.thumbnails;
CREATE POLICY "thumbnails_insert_own" ON public.thumbnails
  FOR INSERT TO authenticated
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- 4-3. 수정(UPDATE) 정책: 본인 소유의 썸네일만 수정 가능
DROP POLICY IF EXISTS "thumbnails_update_own" ON public.thumbnails;
CREATE POLICY "thumbnails_update_own" ON public.thumbnails
  FOR UPDATE TO authenticated
  USING ( (SELECT auth.uid()) = user_id )
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- 4-4. 삭제(DELETE) 정책: 본인이 생성한 썸네일만 삭제 가능
DROP POLICY IF EXISTS "thumbnails_delete_own" ON public.thumbnails;
CREATE POLICY "thumbnails_delete_own" ON public.thumbnails
  FOR DELETE TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

-- ────────────────────────────────────────────────────────────
-- 5. images 스토리지 버킷 생성
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,                  -- 웹사이트에서 바로 이미지를 보여주기 위해 public으로 설정
  10485760,              -- 최대 파일 크기: 10MB (10 * 1024 * 1024 bytes)
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

-- ────────────────────────────────────────────────────────────
-- 6. storage.objects 보안 정책(RLS) 설정
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "images_bucket_public_select" ON storage.objects;
CREATE POLICY "images_bucket_public_select" ON storage.objects
  FOR SELECT TO public
  USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "images_bucket_authenticated_insert" ON storage.objects;
CREATE POLICY "images_bucket_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'images' 
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "images_bucket_authenticated_update" ON storage.objects;
CREATE POLICY "images_bucket_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'images' 
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "images_bucket_authenticated_delete" ON storage.objects;
CREATE POLICY "images_bucket_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'images' 
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );
