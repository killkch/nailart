'use client';

/**
 * components/dashboard/PricingModal.tsx
 *
 * React Portal 기반의 결제 및 요금제(Pricing) 모달 컴포넌트
 * ─────────────────────────────────────────────────────────────
 * [주요 특징 및 구현 설명]
 * 1. React Portal (createPortal):
 *    - Next.js의 DOM 트리 최상단(document.body)에 직접 모달을 마운트하여,
 *      부모 컨테이너의 CSS z-index나 overflow 제약 없이 항상 최상단에 안정적으로 렌더링됩니다.
 *    - SSR(서버 사이드 렌더링) 환경에서 document가 없는 에러를 방지하기 위해
 *      mounted 상태를 useEffect로 안전하게 관리합니다.
 *
 * 2. BorderBeam 테두리 효과:
 *    - PromptArea와 동일한 BorderBeam 컴포넌트를 모달 컨테이너 외곽 전체에 적용하여
 *      테두리를 따라 빛나는 세련된 비주얼을 제공합니다.
 *
 * 3. 심플한 가격 카드 (2종):
 *    - 사용자 요청에 따라 불필요한 기능 나열 없이 오직 가격과 크레딧 정보만 직관적으로 제공합니다.
 *      - Pro: ₩20,000 (2만원) / 100 크레딧
 *      - Ultra: ₩40,000 (4만원) / 300 크레딧
 *
 * 4. Polar Checkout 세션 연동:
 *    - 버튼 클릭 시 /api/checkout API를 호출하여 Polar 결제 세션을 생성하고
 *      발급받은 결제 페이지(checkout.url)로 안전하게 이동합니다.
 *    - 로딩 중에는 버튼에 회전 스피너와 함께 진행 상태가 표시되어 중복 클릭을 방지합니다.
 *
 * 5. UX 및 접근성:
 *    - ESC 키 누름 시 모달 닫기
 *    - 바깥쪽 어두운 배경(오버레이) 클릭 시 모달 닫기
 *    - 모달 내부 클릭 시 이벤트 버블링 차단 (stopPropagation)
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Zap, Loader2 } from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';

interface PricingModalProps {
  /** 모달 열림/닫힘 상태 */
  isOpen: boolean;
  /** 모달 닫기 함수 */
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  // SSR 환경에서 document 접근 에러를 방지하기 위한 마운트 상태 플래그
  const [mounted, setMounted] = useState<boolean>(false);

  // 결제 세션 생성 중인 플랜 상태 ('pro' | 'ultra' | null)
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'ultra' | null>(null);

  // 컴포넌트가 브라우저 DOM에 마운트된 후 mounted를 true로 변경
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC 키를 누르면 모달이 닫히도록 이벤트 리스너 등록
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 결제 진행 중에는 닫히지 않도록 보호
      if (e.key === 'Escape' && !loadingPlan) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // 모달이 열려 있을 때 배경 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loadingPlan]);

  // Polar Checkout 세션 생성 및 리다이렉트 핸들러
  const handleCheckout = async (plan: 'pro' | 'ultra') => {
    try {
      setLoadingPlan(plan);

      // 서버의 Polar 결제 세션 생성 API 호출
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

      // 발급받은 Polar 결제창 URL로 리다이렉트
      window.location.href = data.url;
    } catch (err: any) {
      console.error('결제 세션 이동 오류:', err);
      alert(err.message || '결제 진행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setLoadingPlan(null);
    }
  };

  // 서버 렌더링 중이거나 모달이 닫혀있는 경우에는 아무것도 렌더링하지 않음
  if (!mounted || !isOpen) return null;

  // React Portal을 사용하여 document.body 바로 아래에 모달 렌더링
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      {/* ─── 어두운 반투명 블러 배경 (오버레이) ─── */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={() => {
          // 결제 처리 중에는 배경 클릭으로 닫히지 않도록 방지
          if (!loadingPlan) onClose();
        }}
        aria-hidden="true"
      />

      {/* ─── 모달 메인 컨테이너 ─── */}
      <div
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫힘 방지
        className="
          relative w-full max-w-xl rounded-3xl
          bg-[#18191C]/95 backdrop-blur-2xl
          border border-white/10
          p-6 sm:p-8
          shadow-[0_24px_64px_rgba(0,0,0,0.8)]
          overflow-hidden z-10
        "
      >
        {/* 
          프롬프트 입력창(PromptArea)과 동일한 BorderBeam 적용:
          - 테두리를 따라 에메랄드/그린 빛이 회전하는 효과 연출
        */}
        <BorderBeam
          duration={4}
          size={300}
          borderWidth={1.5}
          borderRadius={24}
          reverse
          className="from-transparent via-green-500 to-transparent"
        />

        {/* 닫기 (X) 버튼 */}
        <button
          type="button"
          onClick={onClose}
          disabled={loadingPlan !== null}
          className="
            absolute top-5 right-5 p-2 rounded-full
            text-gray-400 hover:text-white
            bg-white/5 hover:bg-white/10
            border border-white/10
            transition-colors duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-green-400/50
            disabled:opacity-40 disabled:cursor-not-allowed
          "
          aria-label="모달 닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 모달 타이틀 헤더 */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>크레딧 충전 플랜</span>
          </div>
          <h2 id="pricing-modal-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            원하는 플랜을 선택하세요
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            필요한 만큼 충전하고 나만의 유튜브 썸네일을 자유롭게 제작해보세요.
          </p>
        </div>

        {/* ─── 2종 가격 카드 그리드 (Pro & Ultra) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. Pro 플랜 카드 (2만원 / 100 크레딧) */}
          <div
            className="
              relative flex flex-col justify-between
              rounded-2xl p-5 sm:p-6
              bg-[#212328]/80 hover:bg-[#252830]
              border border-white/10 hover:border-white/20
              transition-all duration-200
              shadow-lg group
            "
          >
            <div>
              {/* 플랜 이름 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-white tracking-wide">
                  Pro
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  기본 충전
                </span>
              </div>

              {/* 가격 정보 (2만원) */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    ₩20,000
                  </span>
                  <span className="text-xs text-gray-400">/ 1회</span>
                </div>
              </div>

              {/* 크레딧 정보 (강조) */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 mb-6">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-emerald-300">
                  100 크레딧
                </span>
              </div>
            </div>

            {/* 결제/선택 버튼 */}
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout('pro')}
              className="
                w-full py-2.5 px-4 rounded-xl
                bg-white/10 hover:bg-white/20 active:bg-white/25
                border border-white/10
                text-white text-sm font-semibold
                transition-all duration-150 cursor-pointer
                text-center flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loadingPlan === 'pro' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>결제 준비 중...</span>
                </>
              ) : (
                'Pro 선택하기'
              )}
            </button>
          </div>

          {/* 2. Ultra 플랜 카드 (4만원 / 300 크레딧) */}
          <div
            className="
              relative flex flex-col justify-between
              rounded-2xl p-5 sm:p-6
              bg-[#212328]/80 hover:bg-[#252830]
              border border-green-500/30 hover:border-green-500/50
              transition-all duration-200
              shadow-lg group
            "
          >
            {/* 상단 추천 배지 */}
            <div className="absolute -top-3 right-4">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-md">
                인기 플랜
              </span>
            </div>

            <div>
              {/* 플랜 이름 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                  Ultra
                  <Sparkles className="w-3.5 h-3.5 text-green-400" />
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  최대 할인
                </span>
              </div>

              {/* 가격 정보 (4만원) */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    ₩40,000
                  </span>
                  <span className="text-xs text-gray-400">/ 1회</span>
                </div>
              </div>

              {/* 크레딧 정보 (강조) */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
                <Zap className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm font-semibold text-green-300">
                  300 크레딧
                </span>
              </div>
            </div>

            {/* 결제/선택 버튼 */}
            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout('ultra')}
              className="
                w-full py-2.5 px-4 rounded-xl
                bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300
                text-black text-sm font-bold shadow-[0_4px_16px_rgba(34,197,94,0.25)]
                hover:shadow-[0_6px_20px_rgba(34,197,94,0.35)]
                transition-all duration-150 cursor-pointer
                text-center active:scale-[0.98] flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loadingPlan === 'ultra' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>결제 준비 중...</span>
                </>
              ) : (
                'Ultra 선택하기'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
