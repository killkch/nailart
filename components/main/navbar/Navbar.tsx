'use client';

/**
 * Navbar 컴포넌트 — NailArt-AI
 *
 * 구성:
 *   왼쪽  — 로고 이미지 + 서비스명 텍스트
 *   중앙  — Features / Pricing / Contact 링크
 *   오른쪽 — 로그인 상태에 따라:
 *            미로그인: Get Started 버튼
 *            로그인됨: 유저 아바타 + 이름 + 로그아웃 버튼
 *
 * 주의: /dashboard 경로에서는 대시보드 전용 Navbar가 사용되므로 null을 반환하여 숨깁니다.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // 전역 Auth 상태

// ── 중앙 네비게이션 링크 목록 ──────────────────────────────────
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

// ── 햄버거 아이콘 (모바일, 순수 SVG) ──────────────────────────
function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="18" height="2" rx="1" fill="white" />
      <rect x="2" y="10" width="18" height="2" rx="1" fill="white" />
      <rect x="2" y="15" width="18" height="2" rx="1" fill="white" />
    </svg>
  );
}

// ── 로그아웃 아이콘 (순수 SVG) ────────────────────────────────
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── 기본 아바타 아이콘 (아바타 이미지가 없을 때) ──────────────
function DefaultAvatarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ── 로그인 상태별 오른쪽 버튼 영역 ───────────────────────────
function NavbarAuthArea() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // 로그인 상태 초기 확인 중일 때는 아무것도 렌더링하지 않음 (레이아웃 점프 방지)
  if (loading) {
    return <div className="w-[120px] h-9" aria-hidden="true" />;
  }

  // ── 로그인된 상태 ────────────────────────────────────────────
  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const displayName = user.user_metadata?.full_name as string | undefined
      ?? user.email?.split('@')[0]
      ?? '사용자';

    const handleSignOut = async () => {
      await signOut();
      // 로그아웃 후 홈으로 이동
      router.push('/');
      router.refresh(); // 서버 컴포넌트 캐시 갱신
    };

    return (
      <div className="flex items-center gap-2">
        {/* 유저 아바타 + 이름 */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {/* 아바타 이미지 or 기본 아이콘 */}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${displayName} 프로필`}
              width={26}
              height={26}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="w-[26px] h-[26px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#38BDF8] text-white">
              <DefaultAvatarIcon />
            </span>
          )}
          <span className="text-white/80 text-sm font-medium max-w-[100px] truncate">
            {displayName}
          </span>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          id="logout-btn"
          onClick={handleSignOut}
          className="
            flex items-center gap-1.5
            px-3 py-2 rounded-lg
            text-sm font-medium text-white/60
            transition-all duration-150
            hover:text-white hover:bg-white/10
            cursor-pointer border-0 bg-transparent
          "
          aria-label="로그아웃"
        >
          <LogoutIcon />
          <span className="hidden md:inline">로그아웃</span>
        </button>
      </div>
    );
  }

  // ── 미로그인 상태 ────────────────────────────────────────────
  return (
    <Link
      href="/auth"
      id="get-started-btn"
      className="
        px-7 py-2 rounded-lg
        text-[1.05rem] font-bold text-white no-underline whitespace-nowrap
        backdrop-blur-sm
        shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.25)]
        transition-all duration-150
        hover:-translate-y-px
        hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.38),0_6px_24px_rgba(0,0,0,0.35)]
      "
      style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.40), rgba(56,189,248,0.30))',
      }}
    >
      Get Started →
    </Link>
  );
}

// ── Navbar ────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();

  // 대시보드 페이지에서는 대시보드 전용 Navbar를 사용하므로 숨김 처리합니다.
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-transparent">
      <nav
        className="
          max-w-[1280px] mx-auto
          px-4 md:px-12
          h-16
          grid grid-cols-[1fr_auto_1fr] items-center gap-4
        "
        aria-label="메인 네비게이션"
      >
        {/* ━━━ 왼쪽: 로고 + 서비스명 ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline w-fit"
          aria-label="NailArt-AI 홈으로 이동"
        >
          <Image
            src="/nailart01.png"
            alt="NailArt-AI 로고"
            width={34}
            height={34}
            className="rounded-[7px] object-cover"
            priority
          />

          <span className="text-[1.2rem] font-bold text-white tracking-[-0.01em] whitespace-nowrap">
            NailArt
            <span className="bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">
              -AI
            </span>
          </span>
        </Link>

        {/* ━━━ 중앙: Features / Pricing / Contact ━━━━━━━━━━━━━━━━━ */}
        <ul className="hidden md:flex items-center gap-0.5 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="
                  block px-4 py-1.5 rounded-lg
                  text-[1.08rem] font-medium text-white/70 no-underline whitespace-nowrap
                  transition-colors duration-150
                  hover:text-white hover:bg-white/[0.08]
                "
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ━━━ 오른쪽: 인증 버튼 영역 + 햄버거 ━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex justify-end items-center gap-2">
          <NavbarAuthArea />

          <button
            className="flex md:hidden bg-transparent border-0 cursor-pointer p-1 leading-none"
            aria-label="메뉴 열기"
          >
            <HamburgerIcon />
          </button>
        </div>
      </nav>
    </header>
  );
}
