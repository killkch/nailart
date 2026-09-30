/**
 * types/thumbnail.ts
 *
 * NailArt-AI 썸네일(thumbnails) 테이블 및 스토리지 연동 타입 정의
 * ─────────────────────────────────────────────────────────────
 * Supabase의 public.thumbnails 테이블과 1:1로 매핑되는 TypeScript 인터페이스입니다.
 */

export interface Thumbnail {
  /** 썸네일 고유 ID (UUID) */
  id: string;

  /** 생성한 사용자 ID (public.users의 id 참조) */
  user_id: string;

  /** 썸네일/영상 제목 (기본값: 프롬프트 앞부분) */
  title: string | null;

  /** 생성에 사용된 프롬프트 */
  prompt: string;

  /** 스토리지 이미지 공개 접근 URL */
  image_url: string;

  /** images 버킷 내 상대 파일 경로 (예: userId/thumbnailId.png) */
  storage_path: string;

  /** 이미지 비율 (기본값: '16:9') */
  aspect_ratio: string;

  /** 생성 진행 상태 */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** 레코드 생성 일시 */
  created_at: string;

  /** 레코드 최종 수정 일시 */
  updated_at: string;
}

/** 썸네일 신규 생성 시 전달할 데이터 타입 */
export interface CreateThumbnailInput {
  title?: string;
  prompt: string;
  image_url: string;
  storage_path: string;
  aspect_ratio?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}
