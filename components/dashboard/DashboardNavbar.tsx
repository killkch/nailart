'use client';

/**
 * components/dashboard/DashboardNavbar.tsx
 *
 * 대시보드 전용 플로팅 네비게이션 바
 * ─────────────────────────────────────────────────────────────
 * [요구사항 구현 세부사항]
 * 1. 배경: transparent (투명)
 * 2. 좌측: 독립된 공간에 떠있는 플로팅 알약(Pill) 스타일의 로고 버튼
 * 3. 우측: 독립된 공간에 떠있는 플로팅 알약(Pill) 스타일의 프로필 팝오버
 * 4. 프로필 팝오버: 프로필 사진(또는 이니셜 아바타)이 보이고, 호버 시 하단에 부드럽게
 *    사인 아웃(Sign Out) 옵션이 노출되는 팝오버 드롭다운 구현
 * 5. 아이콘은 lucide-react 표준 라이브러리 사용
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardNavbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 사용자 정보 추출 (이름 및 아바타 URL)
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    '크리에이터';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const userEmail = user?.email ?? '';

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

  return (
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
            {/* 프로필 이미지 (없을 시 이니셜/아이콘) */}
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

            {/* 사용자 이름 및 배지 */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-200 group-hover:text-white max-w-[110px] truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-purple-400 font-medium leading-tight flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Free 플랜
              </span>
            </div>
          </button>

          {/* ─── 호버 시 나타나는 팝오버 (드롭다운 카드) ─── */}
          <div
            className={`
              absolute right-0 top-full pt-2 w-56
              transition-all duration-200 ease-out origin-top-right
              ${isPopoverOpen ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-95 invisible pointer-events-none'}
            `}
          >
            <div className="p-2 rounded-2xl bg-[#1F2023]/95 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
              {/* 유저 상세 정보 헤더 */}
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-xs font-semibold text-gray-200 truncate">{displayName}</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{userEmail}</p>
              </div>

              {/* 로그아웃 (사인 아웃) 버튼 */}
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
  );
}
