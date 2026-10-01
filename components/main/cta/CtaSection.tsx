'use client';

/**
 * components/main/cta/CtaSection.tsx
 *
 * NailArt-AI 랜딩 페이지 - CTA (Call To Action) 섹션
 * ─────────────────────────────────────────────────────────────
 * [디자인 및 주요 특징]
 * 1. 박스(Box) 형태의 프리미엄 글래스모피즘 카드 (max-w-4xl, rounded-3xl)
 * 2. 테두리를 따라 빛이 회전하는 Magic UI BorderBeam 네온 광원 효과 적용
 * 3. 직관적이고 강력한 중심 메시지 및 액션 유도 헤드라인
 * 4. useAuth 연동:
 *    - 비로그인 유저: "무료로 썸네일 제작 시작하기 →" (/auth 이동)
 *    - 로그인 유저: "내 대시보드로 이동하기 →" (/dashboard 이동)
 * 5. 카드 등록 불필요 / 2초 완성 / 무료 크레딧 즉시 지급 안내 뱃지 포함
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BorderBeam } from '@/components/ui/border-beam';
import { Rocket, ArrowRight, Sparkles, Zap, CreditCard } from 'lucide-react';

export default function CtaSection() {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;

  return (
    <section className="relative w-full py-20 md:py-28 px-4 sm:px-6 md:px-12 overflow-hidden bg-[#050508]">
      {/* ── 배경 방사형 글로우 조명 ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full opacity-20 pointer-events-none blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.5) 0%, rgba(56,189,248,0.3) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* ─── 메인 박스(Box) 컨테이너 ─── */}
        <div
          className="
            relative rounded-3xl sm:rounded-[36px]
            p-8 sm:p-12 md:p-16
            bg-gradient-to-b from-[#1E2023]/95 via-[#16171B]/95 to-[#0E0F12]
            backdrop-blur-2xl border border-white/10
            shadow-[0_24px_70px_rgba(0,0,0,0.7)]
            text-center space-y-8
            overflow-hidden
          "
        >
          {/* BorderBeam 테두리 회전 광원 효과 */}
          <BorderBeam
            size={340}
            duration={4}
            colorFrom="#A78BFA"
            colorTo="#38BDF8"
            borderWidth={2}
            borderRadius={32}
          />

          {/* 1. 상단 뱃지 */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(167,139,250,0.15)]">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span>단 2초 만에 시작하는 유튜브 클릭률 혁신</span>
            </div>
          </div>

          {/* 2. 중심 메시지 (헤드라인 & 설명) */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              오늘 업로드할 유튜브 영상에, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent">
                시선을 사로잡는 썸네일
              </span>
              을 선물하세요
            </h2>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed pt-1">
              더 이상 포토샵과 씨름할 필요가 없습니다. 채널 주제와 아이디어만 입력하면, AI가 조회수를 폭발시키는 최고 수준의 썸네일 아트를 완성합니다.
            </p>
          </div>

          {/* 3. 중심 액션 버튼 */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isLoggedIn ? '/dashboard' : '/auth'}
              className="
                group relative inline-flex items-center justify-center gap-3
                px-8 sm:px-10 py-4 sm:py-4.5 rounded-full
                bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8]
                text-white font-extrabold text-base sm:text-lg
                shadow-[0_0_35px_rgba(167,139,250,0.45)]
                hover:shadow-[0_0_50px_rgba(167,139,250,0.65)]
                hover:scale-[1.03] active:scale-[0.98]
                transition-all duration-200 no-underline
                w-full sm:w-auto
              "
            >
              <span>{isLoggedIn ? '내 대시보드로 이동하기' : '무료로 썸네일 제작 시작하기'}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* 4. 하단 혜택 뱃지 리스트 */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>가입 즉시 무료 크레딧 제공</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400 shrink-0" />
              <span>2초 만에 초고화질 완성</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>신용카드 등록 불필요</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
