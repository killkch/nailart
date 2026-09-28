'use client';

/**
 * Navbar 컴포넌트 — NailArt-AI
 *
 * 구성:
 *   왼쪽  — 로고 이미지 + 서비스명 텍스트
 *   중앙  — Features / Pricing / Contact 링크
 *   오른쪽 — Get Started 버튼
 *
 * 스타일: 100% Tailwind CSS 기반
 * 아이콘 라이브러리 미사용 (SVG 직접 작성)
 */

import Image from 'next/image';
import Link from 'next/link';

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

// ── Navbar ────────────────────────────────────────────────────
export default function Navbar() {
  return (
    /*
      fixed        — 스크롤해도 화면 상단에 고정
      top-0 left-0 right-0 — 상단 전체 너비
      z-[100]      — 히어로 캔버스(z-index 2) 위에 표시
      bg-transparent — 완전 투명 배경
    */
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
          {/* /public/nailart01.png */}
          <Image
            src="/nailart01.png"
            alt="NailArt-AI 로고"
            width={34}
            height={34}
            className="rounded-[7px] object-cover"
            priority
          />

          {/* 서비스명: NailArt + -AI(그라디언트) */}
          <span className="text-[1.2rem] font-bold text-white tracking-[-0.01em] whitespace-nowrap">
            NailArt
            {/*
              그라디언트 텍스트:
              bg-gradient-to-r  — 좌→우 그라디언트
              from-[#A78BFA]    — 보라
              to-[#38BDF8]      — 하늘
              bg-clip-text text-transparent — 텍스트에 그라디언트 적용
            */}
            <span className="bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">
              -AI
            </span>
          </span>
        </Link>

        {/* ━━━ 중앙: Features / Pricing / Contact ━━━━━━━━━━━━━━━━━ */}
        {/*
          hidden md:flex — 모바일(< 768px)에서 숨김, 데스크톱에서 표시
          list-none m-0 p-0 — ul 기본 스타일 제거
        */}
        <ul className="hidden md:flex items-center gap-0.5 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              {/*
                hover:text-white          — 호버 시 텍스트 흰색
                hover:bg-white/[0.08]     — 호버 시 연한 흰색 배경
                transition-colors         — 색상 전환 애니메이션
                duration-150              — 150ms
              */}
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

        {/* ━━━ 오른쪽: Get Started + 햄버거 ━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex justify-end items-center gap-2">

          {/*
            Get Started 버튼:
            - 배경 그라디언트(rgba)와 box-shadow는 Tailwind arbitrary value로 처리
            - hover:-translate-y-px  — 호버 시 1px 위로
            - backdrop-blur-sm       — 버튼 자체에 살짝 블러
          */}
          <Link
            href="auth"
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
              /* rgba 값이 포함된 그라디언트는 Tailwind 임의값으로 표현이 복잡하여 inline 유지 */
              background: 'linear-gradient(135deg, rgba(167,139,250,0.40), rgba(56,189,248,0.30))',
            }}
          >
            Get Started →
          </Link>

          {/*
            햄버거 버튼:
            flex md:hidden — 데스크톱에서 숨기고 모바일에서만 표시
          */}
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
