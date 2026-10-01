'use client';

/**
 * components/dashboard/DashboardNavbar.tsx
 *
 * 대시보드 전용 플로팅 네비게이션 바
 * ─────────────────────────────────────────────────────────────
 * [주요 기능 및 구성]
 * 1. 배경: transparent (투명 플로팅 디자인)
 * 2. 좌측: 서비스 로고 및 대시보드 홈 링크
 * 3. 우측: 프로필 아바타 및 호버/클릭 시 노출되는 팝오버 메뉴
 * 4. 실시간 사용자 플랜 및 크레딧 반영:
 *    - Supabase public.users 테이블에서 사용자의 plan과 credits를 비동기로 조회
 *    - 상단 알약 버튼에 현재 플랜 및 잔여 크레딧(예: Pro 플랜 · 100 C)을 세련되게 노출
 *    - 요금제 모달 닫기 시 또는 결제 완료 후 크레딧 정보를 자동으로 최신 갱신
 * 5. 프로필 팝오버 메뉴:
 *    - 사용자 이름, 이메일, 잔여 크레딧 대시보드 미니 카드
 *    - '크레딧 충전 (요금제)' 버튼: 클릭 시 React Portal 기반의 PricingModal 팝업 표시
 *    - ★ '구독 관리 (Manage Subscription)' 버튼 (Polar 공식 가이드 준수):
 *      * 사용자의 플랜이 'free'가 아닌 유료 플랜(Pro, Ultra 등)인 경우에만 특별 노출
 *      * Polar 공식 권장 경로인 `/portal`로 링크하여 사전 인증된 세션(Pre-authenticated session)으로
 *        이메일 인증 코드 입력 없이 새 탭에서 즉시 결제 수단 변경/영수증 다운로드/구독 해지 가능
 *    - '사인 아웃 (로그아웃)' 버튼: 클릭 시 로그아웃 및 메인 화면 이동
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  User as UserIcon,
  Sparkles,
  CreditCard,
  Zap,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import PricingModal from '@/components/dashboard/PricingModal';

interface UserProfileData {
  plan: string;
  credits: number;
}

export default function DashboardNavbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // 프로필 드롭다운 팝오버 열림/닫힘 상태
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 크레딧 요금제 결제 모달 열림/닫힘 상태
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // 사용자의 플랜 및 잔여 크레딧 상태 (기본값: free / 0)
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    plan: 'free',
    credits: 0,
  });

  // 사용자 정보 추출 (이름 및 아바타 URL)
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    '크리에이터';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const userEmail = user?.email ?? '';

  // Supabase 클라이언트에서 사용자의 최신 플랜 및 크레딧 조회
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('plan, credits')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserProfile({
          plan: data.plan || 'free',
          credits: typeof data.credits === 'number' ? data.credits : 0,
        });
      }
    } catch (err) {
      console.error('사용자 프로필 및 크레딧 조회 실패:', err);
    }
  }, [user?.id]);

  // 로그인 상태가 확인되면 사용자 프로필 정보 조회 및 전역 이벤트 리슨
  useEffect(() => {
    fetchUserProfile();

    // 썸네일 생성 성공 시 크레딧 차감 이벤트를 감지하여 실시간 재조회
    const handleCreditUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('credit-updated', handleCreditUpdate);
    return () => {
      window.removeEventListener('credit-updated', handleCreditUpdate);
    };
  }, [fetchUserProfile]);

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('로그아웃 중 오류가 발생했습니다:', err);
    }
  };

  // 요금제 모달 열기 핸들러
  const handleOpenPricingModal = () => {
    setIsPopoverOpen(false); // 팝오버 닫기
    setIsPricingModalOpen(true); // 요금제 모달 열기
  };

  // 요금제 모달 닫기 핸들러 (닫힐 때 최신 크레딧 다시 조회)
  const handleClosePricingModal = () => {
    setIsPricingModalOpen(false);
    fetchUserProfile();
  };

  // 플랜별 텍스트 및 스타일 포맷터
  const planDisplayName =
    userProfile.plan.toLowerCase() === 'ultra'
      ? 'Ultra'
      : userProfile.plan.toLowerCase() === 'pro'
      ? 'Pro'
      : 'Free';

  // 사용자가 유료 플랜(Free가 아님)인지 확인
  const isPaidPlan = userProfile.plan.toLowerCase() !== 'free';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-5 md:p-7">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* ─── 좌측: 독립된 플로팅 로고 버튼 ─── */}
          <div className="pointer-events-auto">
            <Link
              href="/dashboard"
              className="
                group flex items-center gap-3 px-4 py-2 rounded-full
                bg-[#1E2023]/80 hover:bg-[#2A2B2F]
                backdrop-blur-xl border border-white/10 hover:border-white/20
                shadow-[0_8px_32px_rgba(0,0,0,0.36)]
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                no-underline
              "
              aria-label="대시보드 홈으로 이동"
            >
              {/* 서비스 로고 이미지 */}
              <div className="relative w-7 h-7 rounded-full overflow-hidden shadow-inner ring-1 ring-white/20">
                <Image
                  src="/nailart01.png"
                  alt="NailArt-AI 로고"
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>

              {/* 서비스명 텍스트 */}
              <span className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-1">
                NailArt
                <span className="bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent font-extrabold">
                  -AI
                </span>
              </span>
            </Link>
          </div>

          {/* ─── 우측: 독립된 플로팅 프로필 팝오버 ─── */}
          <div
            className="pointer-events-auto relative"
            onMouseEnter={() => setIsPopoverOpen(true)}
            onMouseLeave={() => setIsPopoverOpen(false)}
          >
            {/* 상단 프로필 트리거 알약 버튼 */}
            <button
              type="button"
              className="
                flex items-center gap-2.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full
                bg-[#1E2023]/80 hover:bg-[#2A2B2F]
                backdrop-blur-xl border border-white/10 hover:border-white/20
                shadow-[0_8px_32px_rgba(0,0,0,0.36)]
                transition-all duration-200 cursor-pointer
                group
              "
              aria-haspopup="true"
              aria-expanded={isPopoverOpen}
            >
              {/* 프로필 이미지 (없을 시 기본 아이콘) */}
              <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-purple-400/40 flex items-center justify-center bg-gradient-to-br from-[#A78BFA] to-[#38BDF8] text-white">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${displayName}의 프로필`}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>

              {/* 사용자 이름 및 실시간 플랜/크레딧 뱃지 */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white max-w-[120px] truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-green-400 font-medium leading-tight flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-green-400 shrink-0" />
                  <span>{planDisplayName} 플랜</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-emerald-300 font-semibold">{userProfile.credits} C</span>
                </span>
              </div>
            </button>

            {/* ─── 호버/클릭 시 노출되는 팝오버 메뉴 카드 ─── */}
            <div
              className={`
                absolute right-0 top-full pt-2 w-64
                transition-all duration-200 ease-out origin-top-right
                ${isPopoverOpen ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-95 invisible pointer-events-none'}
              `}
            >
              <div className="p-2.5 rounded-2xl bg-[#1F2023]/95 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                {/* 1. 유저 상세 정보 헤더 */}
                <div className="px-3 py-2 border-b border-white/5 mb-2">
                  <p className="text-xs font-semibold text-gray-200 truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{userEmail}</p>
                </div>

                {/* 2. 실시간 잔여 크레딧 미니 인포 박스 */}
                <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">잔여 크레딧</p>
                      <p className="text-sm font-bold text-white leading-none mt-0.5">{userProfile.credits} 크레딧</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {planDisplayName}
                  </span>
                </div>

                {/* 3. 크레딧 충전 (요금제) 버튼 -> PricingModal 트리거 */}
                <button
                  type="button"
                  onClick={handleOpenPricingModal}
                  className="
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                    text-xs font-medium text-emerald-300 hover:text-emerald-200
                    bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30
                    transition-all duration-150 cursor-pointer border border-emerald-500/20 mb-1.5
                  "
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">크레딧 충전 (요금제)</span>
                </button>

                {/* 4. ★ 유료 구독자 전용: 구독 관리 (Manage Subscription) 버튼 */}
                {/* Polar 공식 문서 가이드: Point a link in your app at /portal */}
                {isPaidPlan && (
                  <Link
                    href="/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      w-full flex items-center justify-between px-3 py-2 rounded-xl
                      text-xs font-medium text-purple-300 hover:text-purple-200
                      bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30
                      transition-all duration-150 cursor-pointer border border-purple-500/20 mb-1.5
                      no-underline
                    "
                    title="Polar 고객 포털에서 카드 변경, 영수증 다운로드, 구독 해지 등을 진행합니다."
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold">구독 관리 (포털)</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-400/80" />
                  </Link>
                )}

                {/* 5. 로그아웃 (사인 아웃) 버튼 */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                    text-xs font-medium text-rose-400 hover:text-rose-300
                    hover:bg-rose-500/10 active:bg-rose-500/20
                    transition-colors cursor-pointer border-0
                  "
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>사인 아웃 (로그아웃)</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* ─── React Portal 기반 요금제(Pricing) 모달 ─── */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={handleClosePricingModal}
      />
    </>
  );
}
