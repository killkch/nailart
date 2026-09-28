'use client';

/**
 * app/dashboard/page.tsx
 *
 * NailArt-AI 로그인 사용자 대시보드 페이지
 * ─────────────────────────────────────────────────────────────
 * [요구사항 반영 내역]
 * 1. 배경: checkgrid가 아닌 깔끔한 단일 그리드 타일(Grid Tile) 패턴 (#181818)
 * 2. 상단 네비게이션: 새로 제작된 components/dashboard/DashboardNavbar 연동
 *    (투명 배경, 좌측 독립 로고 플로팅 버튼, 우측 사용자 프로필 팝오버)
 * 3. 중앙 PromptArea(PromptInputBox):
 *    - 대형 프롬프트 입력 영역 테두리에 BorderBeam(그린 네온 빔) 디자인 적용
 *    - duration={4}, size={300}, reverse, from-transparent via-green-500 to-transparent 반영
 * 4. 인증 보호: 비로그인 시 자동으로 /auth 로 안전하게 리디렉션
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Wand2, Compass, Layers, Film } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { BorderBeam } from '@/components/ui/border-beam';

// ── 1. 단일 그리드 타일 배경 스타일 ─────────────────────────────
// 복잡한 체커보드 대신 현대적이고 심플한 격자선 그리드 타일로 구성합니다.
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
    prompt: '일본 오사카 여행 3박 4일 감성 브이로그, 따뜻한 노을빛 색감, 맑고 청량한 거리 배경, 감각적인 한글 캘리그라피 타이틀',
  },
  {
    icon: Wand2,
    label: '2026 AI 혁신 트렌드 완벽 정리',
    prompt: '미래지향적인 네온 블루와 퍼플 사이버펑크 톤, 인공지능 로봇 손과 디지털 홀로그램, 압도적인 긴장감의 테크 유튜브 썸네일',
  },
  {
    icon: Compass,
    label: '월 1,000만원 버는 부업 비법 공개',
    prompt: '신뢰감을 주는 다크 그린 & 골드 톤, 실시간 급상승 수익 그래프와 감탄하는 인물 표정 강조, 직관적인 고CTR 썸네일',
  },
  {
    icon: Layers,
    label: '초보자도 10분 만에 끝내는 홈트레이닝 루틴',
    prompt: '에너지 넘치는 오렌지 & 블랙 대비, 땀 흘리며 운동하는 역동적인 포즈, 직관적인 비포애프터 그래픽 배치',
  },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 프롬프트 입력 상태 및 제출 메시지 관리
  const [isGenerating, setIsGenerating] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // ── 비로그인 사용자 /auth 리디렉션 보호 ────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // 프롬프트 제출 핸들러
  const handleSendPrompt = (message: string, files?: File[]) => {
    console.log('프롬프트 전송:', message);
    if (files && files.length > 0) {
      console.log('첨부된 파일:', files);
    }

    setIsGenerating(true);
    setSubmittedMessage(message);

    // AI 생성 시뮬레이션 (3초 후 완료 알림)
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  // 로딩 중일 때 로딩 인디케이터 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={GRID_TILE_STYLE}>
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
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden" style={GRID_TILE_STYLE}>
      
      {/* ── 1. 대시보드 플로팅 네비게이션 바 (투명 배경 + 독립 알약 버튼) ── */}
      <DashboardNavbar />

      {/* ── 2. 중앙 집중형 대형 PromptArea ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-24 md:py-32 w-full max-w-4xl mx-auto z-10">
        
        {/* 상단 헤더 배지 & 타이틀 문구 */}
        <div className="text-center mb-8 flex flex-col items-center animate-in fade-in-50 duration-700">
          
          {/* 상단 펄스 배지 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/80 text-xs md:text-sm font-medium mb-4 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] animate-pulse" />
            <span>AI 기반 고효율 유튜브 썸네일 생성기</span>
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
            영상 주제, 원하는 분위기 또는 참고할 이미지를 전달해 주시면 단 2초 만에 시선을 사로잡는 최적의 썸네일을 기획합니다.
          </p>
        </div>

        {/* ── 3. 대형 AI 프롬프트 입력 컴포넌트 (PromptInputBox) ── */}
        <div className="w-full shadow-2xl relative group rounded-3xl overflow-hidden">
          {/* 부드러운 백그라운드 글로우 조명 효과 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-sky-500/20 to-purple-600/20 rounded-[28px] blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 -z-10" />

          {/* PromptInputBox 본체 */}
          <PromptInputBox
            onSend={handleSendPrompt}
            isLoading={isGenerating}
            placeholder="예: 20대 타겟 재테크 유튜브 썸네일, 눈에 띄는 옐로우 타이포와 직관적인 차트 이미지..."
            className="w-full text-base sm:text-lg border-white/10"
          />

          {/* 
            PromptInputBox 테두리에 적용된 BorderBeam 효과
            - duration: 4초 주기
            - size: 300px 크기의 빛나는 빔
            - reverse: 역방향 회전
            - className: 녹색(green-500) 그라디언트 빔 적용
          */}
          <BorderBeam
            duration={4}
            size={300}
            borderWidth={1.5}
            reverse
            className="from-transparent via-green-500 to-transparent"
          />
        </div>

        {/* 생성 진행 상태 알림창 (프롬프트 전송 시) */}
        {submittedMessage && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-[#1E2023]/90 border border-purple-500/30 backdrop-blur-md flex items-center justify-between text-xs sm:text-sm text-gray-200 animate-in fade-in-50 slide-in-from-top-2">
            <div className="flex items-center gap-2.5 truncate mr-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span className="text-gray-400">입력된 프롬프트:</span>
              <span className="font-medium text-white truncate max-w-[450px]">{submittedMessage}</span>
            </div>
            {isGenerating ? (
              <span className="text-purple-400 flex items-center gap-1.5 flex-shrink-0">
                <Wand2 className="w-4 h-4 animate-spin" /> 생성 분석 중...
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 flex-shrink-0 font-medium">
                ✓ 준비 완료
              </span>
            )}
          </div>
        )}

        {/* ── 4. 빠른 프롬프트 제안 태그 (칩 형태) ── */}
        <div className="w-full mt-8">
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
                  className="
                    flex items-center gap-3 p-3 rounded-xl text-left
                    bg-[#1F2023]/60 hover:bg-[#282A2E]
                    border border-white/5 hover:border-purple-500/40
                    text-gray-300 hover:text-white
                    transition-all duration-200 cursor-pointer group
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

      </main>

      {/* ── 5. 하단 미니멀 푸터 안내 ── */}
      <footer className="w-full py-6 text-center text-xs text-gray-600 border-t border-white/[0.04] z-10">
        <p>© 2026 NailArt-AI. 모든 썸네일 생성 및 저작권은 크리에이터에게 귀속됩니다.</p>
      </footer>

    </div>
  );
}
