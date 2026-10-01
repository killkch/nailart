'use client';

/**
 * app/dashboard/page.tsx
 *
 * NailArt-AI 로그인 사용자 대시보드 페이지
 * ─────────────────────────────────────────────────────────────
 * [주요 기능]
 * 1. 단일 그리드 타일 배경 디자인 (#181818)
 * 2. 독립 알약 버튼 스타일의 DashboardNavbar 연동 (실시간 잔여 크레딧 표시)
 * 3. 중앙 집중형 PromptArea(PromptInputBox) + 녹색 BorderBeam 디자인
 * 4. 다중 참조 이미지(개당 5MB, 최대 10개) 및 프롬프트 기반 썸네일 생성 API 연동
 * 5. 생성 시 1회당 1크레딧 자동 차감 및 잔여 크레딧 부족 시 결제(Pricing) 모달 자동 팝업 유도
 * 6. 결제 성공 리다이렉트(?checkout=success) 시 크레딧 즉시 자동 검증 및 실시간 합산 충전
 * 7. 생성된 16:9 썸네일 즉시 미리보기 및 원클릭 다운로드
 * 8. 하단 "내 썸네일 갤러리" 실시간 동기화
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Wand2,
  Compass,
  Layers,
  Film,
  Download,
  ExternalLink,
  Clock,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import PricingModal from '@/components/dashboard/PricingModal';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { BorderBeam } from '@/components/ui/border-beam';
import type { Thumbnail } from '@/types/thumbnail';

// ── 단일 그리드 타일 배경 스타일 ─────────────────────────────
const GRID_TILE_STYLE: React.CSSProperties = {
  backgroundColor: '#181818',
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
  backgroundPosition: '0 0',
};

// ── 빠른 프롬프트 예시 제안 목록 ─────────────────────────────
const QUICK_SUGGESTIONS = [
  {
    icon: Film,
    label: '일본 오사카 3박 4일 감성 브이로그 썸네일',
    prompt:
      '일본 오사카 여행 3박 4일 감성 브이로그, 따뜻한 노을빛 색감, 맑고 청량한 거리 배경, 감각적인 한글 캘리그라피 타이틀, 16:9 유튜브 썸네일',
  },
  {
    icon: Wand2,
    label: '2026 AI 혁신 트렌드 완벽 정리',
    prompt:
      '미래지향적인 네온 블루와 퍼플 사이버펑크 톤, 인공지능 로봇 손과 디지털 홀로그램, 압도적인 긴장감의 테크 유튜브 썸네일',
  },
  {
    icon: Compass,
    label: '월 1,000만원 버는 부업 비법 공개',
    prompt:
      '신뢰감을 주는 다크 그린 & 골드 톤, 실시간 급상승 수익 그래프와 감탄하는 인물 표정 강조, 직관적인 고CTR 썸네일',
  },
  {
    icon: Layers,
    label: '초보자도 10분 만에 끝내는 홈트레이닝 루틴',
    prompt:
      '에너지 넘치는 오렌지 & 블랙 대비, 땀 흘리며 운동하는 역동적인 포즈, 직관적인 비포애프터 그래픽 배치',
  },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 상태 관리: 생성 로딩, 에러, 결제 성공 메시지, 썸네일 히스토리 목록
  const [isGenerating, setIsGenerating] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreditInsufficient, setIsCreditInsufficient] = useState(false);
  const [latestThumbnail, setLatestThumbnail] = useState<Thumbnail | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 크레딧 부족 시 팝업되는 요금제(Pricing) 모달 상태
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // ── 비로그인 사용자 /auth 리디렉션 보호 ────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // ── 결제 완료 복귀 URL(?checkout=success) 자동 검증 및 크레딧 충전 ──
  useEffect(() => {
    if (!user) return;

    const queryParams = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = queryParams.get('checkout') === 'success';
    const sessionId = queryParams.get('session_id');

    if (isCheckoutSuccess) {
      const verifyAndAddCredits = async () => {
        try {
          const verifyUrl = sessionId
            ? `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`
            : `/api/checkout/verify`;

          const response = await fetch(verifyUrl);
          const data = await response.json();

          if (data.success) {
            const added = data.creditsAdded || data.syncedCredits || 0;
            if (added > 0) {
              setSuccessMessage(`결제가 성공적으로 완료되어 ${added} 크레딧이 충전되었습니다! 🎉`);
            } else {
              setSuccessMessage('결제가 확인되어 크레딧이 정상 반영되었습니다! 🎉');
            }

            // 상단 네비게이션 바에 최신 크레딧 즉시 동기화
            window.dispatchEvent(new Event('credit-updated'));

            // 5초 후 축하 배너 자동 숨김
            setTimeout(() => setSuccessMessage(null), 7000);
          }
        } catch (err) {
          console.error('결제 검증 오류:', err);
        } finally {
          // 주소창의 쿼리스트링 정리 (새로고침 시 중복 호출 방지)
          router.replace('/dashboard');
        }
      };

      verifyAndAddCredits();
    }
  }, [user, router]);

  // ── 사용자의 기존 썸네일 목록 불러오기 ──────────────────────
  const fetchThumbnails = useCallback(async () => {
    try {
      const response = await fetch('/api/thumbnails');
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && Array.isArray(data.thumbnails)) {
        setThumbnails(data.thumbnails);
      }
    } catch (err) {
      console.error('썸네일 목록 로드 중 오류:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchThumbnails();
    }
  }, [user, fetchThumbnails]);

  // ── 단일 파일을 Base64 객체로 변환하는 유틸 함수 ────────────
  const convertFileToBase64 = (
    file: File
  ): Promise<{ mime_type: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [header, base64Data] = result.split(';base64,');
        const mimeType = header.replace('data:', '');
        resolve({ mime_type: mimeType, data: base64Data });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // ── 프롬프트 제출 핸들러 (다중 참조 이미지 & 크레딧 검증) ───
  const handleSendPrompt = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setIsCreditInsufficient(false);
    setSubmittedMessage(message);

    try {
      // 1. 첨부된 다중 참조 이미지들을 Base64 배열로 일괄 비동기 변환 (최대 10개)
      let referenceImagesData: Array<{ mime_type: string; data: string }> = [];
      if (files && files.length > 0) {
        const imageFiles = files
          .filter((f) => f.type.startsWith('image/'))
          .slice(0, 10);
        referenceImagesData = await Promise.all(
          imageFiles.map((file) => convertFileToBase64(file))
        );
      }

      // 2. Next.js 서버 Route Handler로 썸네일 생성 요청
      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          reference_images: referenceImagesData, // 다중 이미지 배열 (최대 10개)
          reference_image: referenceImagesData[0] || null, // 단일 이미지 하위 호환
          aspect_ratio: '16:9',
        }),
      });

      const result = await response.json();

      // ── 크레딧 부족 (402 Payment Required) 처리 ───────────────
      if (response.status === 402 || result.error === 'INSUFFICIENT_CREDITS') {
        setIsCreditInsufficient(true);
        setErrorMessage(
          result.message || '잔여 크레딧이 부족합니다. 요금제에서 크레딧을 충전해주세요.'
        );
        // 사용자 편의를 위해 즉시 요금제 모달 팝업 자동 오픈!
        setIsPricingModalOpen(true);
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || '썸네일 생성 중 문제가 발생했습니다. 다시 시도해 주세요.'
        );
      }

      // 3. 성공 시 상태 갱신 및 네브바 크레딧 동기화 이벤트 발송
      const createdThumbnail: Thumbnail = result.thumbnail;
      setLatestThumbnail(createdThumbnail);
      setThumbnails((prev) => [createdThumbnail, ...prev]);

      // 상단 네비게이션 바에 크레딧 1 차감 반영을 위한 전역 이벤트 발생
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('credit-updated'));
      }
    } catch (err: unknown) {
      console.error('썸네일 생성 오류:', err);
      const msg =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── 이미지 다운로드 핸들러 ─────────────────────────────────
  const handleDownload = async (imageUrl: string, title?: string | null) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title || 'nailart-thumbnail'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('다운로드 오류:', e);
      window.open(imageUrl, '_blank');
    }
  };

  // ── 프롬프트 텍스트 클립보드 복사 ───────────────────────────
  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 로딩 중일 때 로딩 인디케이터 표시
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={GRID_TILE_STYLE}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">대시보드를 준비하는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 사용자가 인증되지 않은 경우 (리디렉션 대기)
  if (!user) return null;

  return (
    <div
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden"
      style={GRID_TILE_STYLE}
    >
      {/* ── 1. 대시보드 플로팅 네비게이션 바 (실시간 크레딧 표시) ── */}
      <DashboardNavbar />

      {/* ── 2. 메인 컨텐츠 영역 ── */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 pt-28 pb-20 w-full max-w-5xl mx-auto z-10">
        {/* 상단 헤더 배지 & 타이틀 문구 */}
        <div className="text-center mb-8 flex flex-col items-center animate-in fade-in-50 duration-700">
          {/* 상단 펄스 배지 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/80 text-xs md:text-sm font-medium mb-4 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] animate-pulse" />
            <span>AI 기반 16:9 유튜브 고CTR 썸네일 엔진</span>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight md:leading-snug mb-3">
            어떤 썸네일을{' '}
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent">
              만들어볼까요?
            </span>
          </h1>

          {/* 서브 설명 문구 */}
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            영상 주제, 원하는 분위기 또는 참고 이미지(최대 10개, 개당 5MB)를 입력하시면 실시간 AI 모델이
            시선을 사로잡는 16:9 유튜브 썸네일을 즉시 생성합니다. (1회당 1크레딧 사용)
          </p>
        </div>

        {/* ── 3. 대형 AI 프롬프트 입력 박스 (PromptInputBox) ── */}
        <div className="w-full shadow-2xl relative group rounded-3xl overflow-hidden mb-6">
          {/* 부드러운 백그라운드 글로우 조명 효과 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-sky-500/20 to-purple-600/20 rounded-[28px] blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 -z-10" />

          {/* PromptInputBox 본체 */}
          <PromptInputBox
            onSend={handleSendPrompt}
            isLoading={isGenerating}
            placeholder="예: 일본 오사카 감성 여행 브이로그, 노을빛 따뜻한 색감과 큼직한 화이트 캘리그라피 타이틀..."
            className="w-full text-base sm:text-lg border-white/10"
          />

          {/* PromptInputBox 테두리 BorderBeam 효과 (녹색 회전 빔) */}
          <BorderBeam
            duration={4}
            size={300}
            borderWidth={1.5}
            reverse
            className="from-transparent via-green-500 to-transparent"
          />
        </div>

        {/* ── 4-1. 결제 완료 성공 축하 알림 배너 ── */}
        {successMessage && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 backdrop-blur-md flex items-center gap-3 text-xs sm:text-sm text-emerald-200 animate-in fade-in-50 slide-in-from-top-2 shadow-lg">
            <PartyPopper className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="flex-1 font-medium">{successMessage}</span>
          </div>
        )}

        {/* ── 4-2. 생성 진행 상태 알림창 ── */}
        {isGenerating && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-[#1E2023]/90 border border-purple-500/40 backdrop-blur-md flex items-center justify-between text-xs sm:text-sm text-gray-200 animate-in fade-in-50 slide-in-from-top-2 shadow-lg">
            <div className="flex items-center gap-3 truncate mr-3">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping flex-shrink-0" />
              <span className="text-gray-400">AI 썸네일 생성 중:</span>
              <span className="font-medium text-white truncate max-w-[450px]">
                {submittedMessage}
              </span>
            </div>
            <span className="text-purple-400 flex items-center gap-1.5 flex-shrink-0 font-medium">
              <Wand2 className="w-4 h-4 animate-spin" /> 이미지 렌더링 중...
            </span>
          </div>
        )}

        {/* ── 4-3. 에러 메시지 알림창 (크레딧 부족 시 충전 버튼 제공) ── */}
        {errorMessage && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs sm:text-sm text-red-200 animate-in fade-in-50 slide-in-from-top-2">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {/* 크레딧 부족 시 노출되는 결제 유도 바로가기 버튼 */}
            {isCreditInsufficient && (
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(true)}
                className="
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                  bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600
                  text-black font-bold text-xs transition cursor-pointer shrink-0
                "
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>크레딧 충전하기</span>
              </button>
            )}
          </div>
        )}

        {/* ── 5. 방금 생성된 최신 썸네일 하이라이트 카드 ── */}
        {latestThumbnail && !isGenerating && (
          <div className="w-full mb-10 p-5 rounded-3xl bg-[#1F2023]/80 border border-emerald-500/40 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  생성 완료 (최신 썸네일)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      latestThumbnail.image_url,
                      latestThumbnail.title
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>다운로드</span>
                </button>
                <a
                  href={latestThumbnail.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
                  title="원본 새창 열기"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 16:9 비율 썸네일 미리보기 */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/50 border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latestThumbnail.image_url}
                alt={latestThumbnail.prompt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white text-xs sm:text-sm line-clamp-2">
                  {latestThumbnail.prompt}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span className="truncate max-w-[80%]">
                프롬프트: {latestThumbnail.prompt}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopyPrompt(latestThumbnail.prompt, latestThumbnail.id)
                }
                className="flex items-center gap-1 text-gray-400 hover:text-white transition cursor-pointer"
              >
                {copiedId === latestThumbnail.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>프롬프트 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── 6. 빠른 프롬프트 제안 태그 (칩 형태) ── */}
        <div className="w-full mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center sm:text-left">
            추천 프롬프트 아이디어
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUICK_SUGGESTIONS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendPrompt(item.prompt)}
                  disabled={isGenerating}
                  className="
                    flex items-center gap-3 p-3 rounded-xl text-left
                    bg-[#1F2023]/60 hover:bg-[#282A2E]
                    border border-white/5 hover:border-purple-500/40
                    text-gray-300 hover:text-white
                    transition-all duration-200 cursor-pointer group
                    disabled:opacity-50 disabled:pointer-events-none
                  "
                >
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 text-gray-400 group-hover:text-purple-300 transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium line-clamp-1">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 7. 최근 생성한 썸네일 갤러리 섹션 ── */}
        {thumbnails.length > 0 && (
          <div className="w-full mt-4">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  내 썸네일 갤러리 ({thumbnails.length})
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {thumbnails.map((thumb) => (
                <div
                  key={thumb.id}
                  className="group relative rounded-2xl bg-[#1E2023]/70 border border-white/10 hover:border-purple-500/50 overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
                >
                  {/* 16:9 썸네일 이미지 */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb.image_url}
                      alt={thumb.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* 호버 액션 오버레이 (다운로드 & 새창 버튼) */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(thumb.image_url, thumb.title)
                        }
                        className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition cursor-pointer"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <a
                        href={thumb.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition"
                        title="원본 보기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* 썸네일 텍스트 메타데이터 */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-300 line-clamp-2 mb-2 font-medium">
                      {thumb.prompt}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-white/5">
                      <span>{new Date(thumb.created_at).toLocaleDateString('ko-KR')}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(thumb.prompt, thumb.id)}
                        className="hover:text-gray-300 transition cursor-pointer"
                      >
                        {copiedId === thumb.id ? '복사됨' : '프롬프트 복사'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── 8. 하단 미니멀 푸터 안내 ── */}
      <footer className="w-full py-6 text-center text-xs text-gray-600 border-t border-white/[0.04] z-10">
        <p>© 2026 NailArt-AI. 모든 썸네일 생성 및 저작권은 크리에이터에게 귀속됩니다.</p>
      </footer>

      {/* ── 9. 크레딧 부족 시 자동 팝업되는 요금제(Pricing) 모달 ── */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => {
          setIsPricingModalOpen(false);
          // 모달 닫힐 때 최신 크레딧 동기화
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('credit-updated'));
          }
        }}
      />
    </div>
  );
}
