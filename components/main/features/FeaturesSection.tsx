'use client';

/**
 * components/main/features/FeaturesSection.tsx
 *
 * NailArt-AI 랜딩 페이지 - Features (주요 기능 소개) 섹션
 * ─────────────────────────────────────────────────────────────
 * [디자인 및 레이아웃]
 * 1. Bento Grid 레이아웃: 메인 와이드 카드(2칸) + 세로/정방형 카드들의 리듬감 있는 비대칭 조합
 * 2. 5가지 실제 쇼케이스 썸네일 이미지 (/main/1.jpeg ~ /main/5.jpeg) 활용
 * 3. 메인 하이라이트 카드에 Magic UI BorderBeam 테두리 광원 회전 효과 적용
 * 4. 글래스모피즘(bg-[#1E2023]/70, backdrop-blur-xl, border-white/10)과 딥 다크 모드 일체감
 * 5. 마우스 호버 시 이미지 줌인 및 네온 뱃지 마이크로 인터랙션
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BorderBeam } from '@/components/ui/border-beam';
import { Sparkles, Zap, Layers, Cpu, Film, ArrowRight } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full py-28 md:py-36 px-4 sm:px-6 md:px-12 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #050508 0%, #0d0d18 50%, #080812 100%)',
      }}
    >
      {/* ── 배경 장식 글로우 조명 ── */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-20 pointer-events-none blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(56,189,248,0.25) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1280px] mx-auto relative z-10 space-y-16 sm:space-y-20">
        
        {/* ── 섹션 헤더 타이틀 ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide uppercase shadow-[0_0_20px_rgba(167,139,250,0.15)]">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-POWERED THUMBNAIL SUITE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            클릭률(CTR)을 폭발시키는{' '}
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent">
              AI 썸네일의 초격차 퀄리티
            </span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            복잡한 그래픽 작업이나 외주 없이, 채널 주제 하나만으로 시선을 사로잡는 최정상급 유튜브 썸네일을 단 2초 만에 생성하세요.
          </p>
        </div>

        {/* ── 벤토 그리드 (Bento Grid) 쇼케이스 ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* ━━━ 카드 1 (메인 와이드: 2열 차지) - /main/3.jpeg ━━━ */}
          <div className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-[#1E2023]/70 backdrop-blur-xl border border-white/10 p-6 sm:p-8 flex flex-col justify-between min-h-[460px] sm:min-h-[500px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-purple-500/40">
            {/* BorderBeam 회전 광원 효과 */}
            <BorderBeam size={300} duration={5} colorFrom="#A78BFA" colorTo="#38BDF8" borderWidth={2} borderRadius={24} />

            {/* 배경 이미지 컨테이너 */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/main/3.jpeg"
                alt="인체 메커니즘 엔진 메타포 썸네일"
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
              />
              {/* 다크 그라디언트 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/60 to-black/20" />
            </div>

            {/* 상단 뱃지 영역 */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>직관적 메타포 렌더링</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                CTR +320% 입증
              </span>
            </div>

            {/* 하단 텍스트 및 설명 */}
            <div className="relative z-10 space-y-3 pt-32 sm:pt-40">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-purple-200 transition-colors">
                아이디어를 0.1초 만에 전달하는 시각적 비유
              </h3>
              <p className="text-gray-300 text-sm sm:text-base max-w-xl leading-relaxed">
                복잡한 과학, 의학, 시사 주제도 시청자가 스크롤을 멈추고 클릭하게 만드는 강렬한 엔진 메타포와 고감도 질감으로 자동 시각화합니다.
              </p>
            </div>
          </div>

          {/* ━━━ 카드 2 (1열 차지) - /main/5.jpeg ━━━ */}
          <div className="group relative rounded-3xl overflow-hidden bg-[#1E2023]/70 backdrop-blur-xl border border-white/10 p-6 sm:p-8 flex flex-col justify-between min-h-[460px] sm:min-h-[500px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-purple-500/40">
            {/* 배경 이미지 컨테이너 */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/main/5.jpeg"
                alt="3D 애니메이션 눈길 자동차 썸네일"
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/50 to-transparent" />
            </div>

            {/* 상단 뱃지 영역 */}
            <div className="relative z-10 flex items-center justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-sky-300 text-xs font-semibold">
                <Film className="w-3.5 h-3.5 text-sky-400" />
                <span>시네마틱 3D 애니메이션</span>
              </span>
            </div>

            {/* 하단 텍스트 및 설명 */}
            <div className="relative z-10 space-y-2 pt-32 sm:pt-40">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-sky-200 transition-colors">
                디즈니·픽사 감성의 스토리텔링
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                살아 숨 쉬는 캐릭터의 표정과 감성적인 날씨·조명 렌더링으로 몰입도 높은 스토리를 전달합니다.
              </p>
            </div>
          </div>

          {/* ━━━ 카드 3 (1열) - /main/2.jpeg ━━━ */}
          <div className="group relative rounded-3xl overflow-hidden bg-[#1E2023]/70 backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col justify-between min-h-[380px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:-translate-y-1">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/main/2.jpeg"
                alt="충격파와 파티클 효과 러닝화 썸네일"
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/55 to-transparent" />
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>시선 강탈 비주얼 이펙트</span>
              </span>
            </div>

            <div className="relative z-10 space-y-2 pt-24">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                폭발적인 충격파와 파티클 연출
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                모바일 피드에서도 단번에 눈에 띄는 고대비 충격파와 빗물 파편 효과로 시청자의 시선을 사로잡습니다.
              </p>
            </div>
          </div>

          {/* ━━━ 카드 4 (1열) - /main/4.jpeg ━━━ */}
          <div className="group relative rounded-3xl overflow-hidden bg-[#1E2023]/70 backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col justify-between min-h-[380px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:-translate-y-1">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/main/4.jpeg"
                alt="홀로그램 알림 인터랙션 썸네일"
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/55 to-transparent" />
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-indigo-300 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>테크 & 홀로그램 인터페이스</span>
              </span>
            </div>

            <div className="relative z-10 space-y-2 pt-24">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                생동감 있는 인물과 퓨처리스틱 UI
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                정교한 캐릭터 시선 처리와 공중에 떠오르는 홀로그램 HUD 그래픽을 유기적으로 조합합니다.
              </p>
            </div>
          </div>

          {/* ━━━ 카드 5 (1열) - /main/1.jpeg ━━━ */}
          <div className="group relative rounded-3xl overflow-hidden bg-[#1E2023]/70 backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col justify-between min-h-[380px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:-translate-y-1">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src="/main/1.jpeg"
                alt="초정밀 부품 메탈 합성 썸네일"
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/55 to-transparent" />
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-cyan-300 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>초정밀 오브젝트 합성</span>
              </span>
            </div>

            <div className="relative z-10 space-y-2 pt-24">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                디테일이 살아있는 하이엔드 아트워크
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                메탈릭 기계 태엽과 운동화 텍스처를 경계선 없이 완벽하게 블렌딩하여 상업적 퀄리티를 완성합니다.
              </p>
            </div>
          </div>

        </div>

        {/* ── 하단 즉시 시작 CTA 배너 ── */}
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-purple-900/40 via-[#1E2023] to-sky-900/30 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            지금 바로 당신의 채널 클릭률을 바꿔보세요
          </h3>
          <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto">
            무료 크레딧으로 첫 썸네일을 2초 만에 만들어볼 수 있습니다.
          </p>
          <div className="pt-2">
            <Link
              href="/auth"
              className="
                inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full
                bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8]
                text-white font-bold text-base sm:text-lg
                shadow-[0_0_30px_rgba(167,139,250,0.4)]
                hover:shadow-[0_0_40px_rgba(167,139,250,0.6)] hover:scale-[1.03]
                active:scale-[0.98] transition-all duration-200 no-underline
              "
            >
              <span>무료로 썸네일 만들기</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
