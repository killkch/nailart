'use client';

/**
 * components/main/pricing/PricingSection.tsx
 *
 * NailArt-AI 랜딩 페이지 - Pricing (요금제 안내) 섹션
 * ─────────────────────────────────────────────────────────────
 * [디자인 및 주요 기능]
 * 1. PricingModal과 100% 동일한 요금제 정책: Pro(₩20,000 / 100크레딧) & Ultra(₩40,000 / 300크레딧)
 * 2. 시각적 위계: Ultra 플랜에 Magic UI BorderBeam 테두리 라이팅 + 인기 플랜 네온 뱃지 적용
 * 3. 스마트 결제 흐름:
 *    - 비로그인 유저: 클릭 시 /auth 페이지로 이동하여 안전하게 로그인 유도
 *    - 로그인 유저: 클릭 즉시 /api/checkout 호출하여 Polar 결제 세션으로 이동
 * 4. 글래스모피즘(bg-[#1E2023]/75, backdrop-blur-xl, border-white/10)과 딥 다크 모드 일체감
 * 5. 상단 Navbar 'Pricing' 링크와 스크롤 연동되는 id="pricing" 앵커 탑재
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BorderBeam } from '@/components/ui/border-beam';
import { Sparkles, Zap, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PricingSection() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 결제 세션 생성 로딩 상태 ('pro' | 'ultra' | null)
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'ultra' | null>(null);

  // 플랜 선택 및 결제 핸들러
  const handlePlanSelect = async (plan: 'pro' | 'ultra') => {
    // 1. 아직 인증 로딩 중인 경우 대기
    if (loading) return;

    // 2. 비로그인 유저는 로그인/회원가입 페이지로 이동
    if (!user) {
      router.push('/auth');
      return;
    }

    // 3. 로그인된 유저는 Polar 결제 세션 즉시 생성
    try {
      setLoadingPlan(plan);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || '결제 페이지를 불러오는 데 실패했습니다.');
      }

      // 발급받은 Polar 호스팅 결제 페이지 URL로 리다이렉트
      window.location.href = data.url;
    } catch (err) {
      console.error('[PricingSection Checkout Error]:', err);
      alert(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="pricing"
      className="relative w-full py-28 md:py-36 px-4 sm:px-6 md:px-12 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #080812 0%, #0d0d1a 50%, #050508 100%)',
      }}
    >
      {/* ── 배경 장식 글로우 조명 ── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full opacity-15 pointer-events-none blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, rgba(167,139,250,0.3) 60%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1100px] mx-auto relative z-10 space-y-16">
        
        {/* ── 섹션 헤더 ── */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide uppercase shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>TRANSPARENT PRICING</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            합리적인 가격으로 누리는{' '}
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#A78BFA] bg-clip-text text-transparent">
              AI 썸네일의 모든 것
            </span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            원하는 만큼 충전하고 언제든지 자율적으로 해지하세요. 시스템 오류 시 100% 자동 즉시 환불을 보장합니다.
          </p>
        </div>

        {/* ── 2열 카드 뷰 (Pro & Ultra) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          
          {/* ━━━ 1. Pro 플랜 카드 (₩20,000 / 100 크레딧) ━━━ */}
          <div
            className="
              relative rounded-3xl p-7 sm:p-9
              bg-[#1E2023]/75 hover:bg-[#252830]/90
              backdrop-blur-xl border border-white/10 hover:border-white/20
              shadow-[0_16px_40px_rgba(0,0,0,0.5)]
              flex flex-col justify-between
              transition-all duration-300
            "
          >
            <div className="space-y-6">
              {/* 상단 플랜 이름 및 태그 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Pro</h3>
                  <p className="text-xs text-gray-400 mt-1">실속형 크리에이터 추천</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  기본 충전
                </span>
              </div>

              {/* 가격 영역 */}
              <div className="pt-2 pb-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    ₩20,000
                  </span>
                  <span className="text-sm font-medium text-gray-400">/ 월</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  1회 생성당 약 200원 꼴의 실속 있는 과금 체계
                </p>
              </div>

              {/* 크레딧 하이라이트 뱃지 */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">100 크레딧 부여</span>
                  <span className="text-[11px] text-gray-400">고화질 썸네일 100회 제작 가능</span>
                </div>
              </div>

              {/* 혜택 목록 */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">포함된 혜택</p>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Full HD (1080p) 고화질 다운로드</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>100+ AI 스타일 템플릿 전체 이용</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>생성 실패 시 100% 자동 즉시 환불</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>유튜브 등 완전한 상업적 이용 권한 보장</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="pt-8">
              <button
                type="button"
                disabled={loadingPlan !== null}
                onClick={() => handlePlanSelect('pro')}
                className="
                  w-full py-3.5 px-6 rounded-2xl
                  bg-white/10 hover:bg-white/20 active:bg-white/25
                  border border-white/15 hover:border-white/30
                  text-white font-bold text-sm sm:text-base
                  shadow-[0_8px_20px_rgba(0,0,0,0.3)]
                  transition-all duration-200 cursor-pointer
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loadingPlan === 'pro' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>결제 페이지로 이동 중...</span>
                  </>
                ) : (
                  <>
                    <span>Pro 플랜 시작하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ━━━ 2. Ultra 플랜 카드 (₩40,000 / 300 크레딧 - 인기 플랜) ━━━ */}
          <div
            className="
              relative rounded-3xl p-7 sm:p-9
              bg-[#1E2023]/85 hover:bg-[#252830]
              backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-500/60
              shadow-[0_20px_50px_rgba(56,189,248,0.15)]
              flex flex-col justify-between
              transition-all duration-300
            "
          >
            {/* Ultra 전용 BorderBeam 테두리 광원 회전 효과 */}
            <BorderBeam
              size={320}
              duration={4.5}
              colorFrom="#38BDF8"
              colorTo="#A78BFA"
              borderWidth={2}
              borderRadius={24}
            />

            {/* 상단 인기 플랜 플로팅 뱃지 */}
            <div className="absolute -top-3.5 right-6 z-20">
              <span className="text-xs font-extrabold px-3.5 py-1 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#A78BFA] text-black shadow-[0_4px_16px_rgba(56,189,248,0.4)]">
                🔥 가장 인기 있는 선택
              </span>
            </div>

            <div className="space-y-6">
              {/* 상단 플랜 이름 및 태그 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Ultra</span>
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </h3>
                  <p className="text-xs text-cyan-300/80 mt-1">전문 크리에이터 & 다채널 운영자 추천</p>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  최대 혜택 (50% 추가)
                </span>
              </div>

              {/* 가격 영역 */}
              <div className="pt-2 pb-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    ₩40,000
                  </span>
                  <span className="text-sm font-medium text-gray-400">/ 월</span>
                </div>
                <p className="text-xs text-cyan-300/90 mt-1.5 font-medium">
                  1회 생성당 약 133원 (최대 가성비 & 3배 크레딧 제공)
                </p>
              </div>

              {/* 크레딧 하이라이트 뱃지 */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/25 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
                </div>
                <div>
                  <span className="text-sm font-bold text-cyan-200 block">300 크레딧 대량 충전</span>
                  <span className="text-[11px] text-cyan-300/70">고화질 썸네일 300회 제작 가능</span>
                </div>
              </div>

              {/* 혜택 목록 */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-cyan-300/80 tracking-wider uppercase">모든 Pro 혜택 + 추가 특전</p>
                <ul className="space-y-2.5 text-sm text-gray-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-white">4K Ultra HD 초고해상도 렌더링 지원</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-white">우선 순위 초고속 GPU 렌더링 파이프라인</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>신규 출시 AI 모델 및 프리셋 우선 제공</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>생성 실패 시 100% 자동 즉시 환불 보장</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>유튜브 등 완전한 상업적 이용 권한 보장</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="pt-8">
              <button
                type="button"
                disabled={loadingPlan !== null}
                onClick={() => handlePlanSelect('ultra')}
                className="
                  w-full py-3.5 px-6 rounded-2xl
                  bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#A78BFA]
                  hover:opacity-90 active:scale-[0.98]
                  text-black font-extrabold text-sm sm:text-base
                  shadow-[0_8px_30px_rgba(56,189,248,0.35)]
                  transition-all duration-200 cursor-pointer
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loadingPlan === 'ultra' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>결제 페이지로 이동 중...</span>
                  </>
                ) : (
                  <>
                    <span>Ultra 플랜 시작하기</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* ── 하단 신뢰 및 보안 안내 뱃지 ── */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Polar 글로벌 보안 결제 (MoR)</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>언제든 고객 포탈에서 1초 만에 해지 가능</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>결제 완료 즉시 크레딧 실시간 충전</span>
          </div>
        </div>

      </div>
    </section>
  );
}
