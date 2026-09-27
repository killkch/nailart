'use client';

/**
 * Navbar 컴포넌트 — NailArt-AI
 *
 * 구성:
 *   왼쪽  — 로고 이미지 + 서비스명 텍스트
 *   중앙  — Features / Pricing / Contact 링크
 *   오른쪽 — Get Started 버튼
 *
 * 스타일: 글라스모피즘 (backdrop-blur, 반투명 배경)
 * 아이콘 라이브러리 미사용 (SVG 직접 작성)
 */

import Image from 'next/image';
import Link from 'next/link';

// ── 중앙 네비게이션 링크 목록 ──────────────────────────────────
const NAV_LINKS = [
  { label: 'Features',  href: '#features' },
  { label: 'Pricing',   href: '#pricing'  },
  { label: 'Contact',   href: '#contact'  },
];

// ── 햄버거 아이콘 (모바일, 순수 SVG) ──────────────────────────
function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2" y="5"  width="18" height="2" rx="1" fill="white" />
      <rect x="2" y="10" width="18" height="2" rx="1" fill="white" />
      <rect x="2" y="15" width="18" height="2" rx="1" fill="white" />
    </svg>
  );
}

// ── Navbar ────────────────────────────────────────────────────
export default function Navbar() {
  return (
    <header
      style={{
        position: 'fixed',          /* 스크롤해도 상단 고정 */
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,

        /* 글라스모피즘: 반투명 + 블러 */
        background: 'rgba(0, 0, 0, 0.30)',
        backdropFilter: 'blur(18px) saturate(130%)',
        WebkitBackdropFilter: 'blur(18px) saturate(130%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px)',
          height: 64,
          display: 'grid',
          /* 3열 그리드: 왼쪽 로고 | 중앙 링크 | 오른쪽 버튼 */
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
        }}
        aria-label="메인 네비게이션"
      >

        {/* ━━━ 왼쪽: 로고 + 서비스명 ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            width: 'fit-content',      /* 클릭 영역이 텍스트 너비만큼만 */
          }}
          aria-label="NailArt-AI 홈으로 이동"
        >
          {/* /public/nailart01.png */}
          <Image
            src="/nailart01.png"
            alt="NailArt-AI 로고"
            width={34}
            height={34}
            style={{ borderRadius: 7, objectFit: 'cover' }}
            priority
          />
          <span
            style={{
              fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            NailArt
            <span
              style={{
                background: 'linear-gradient(90deg, #A78BFA, #38BDF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              -AI
            </span>
          </span>
        </Link>

        {/* ━━━ 중앙: Features / Pricing / Contact ━━━━━━━━━━━━━━━ */}
        <ul
          className="nav-center-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                style={{
                  display: 'block',
                  padding: '6px 16px',
                  borderRadius: 8,
                  color: 'rgba(255, 255, 255, 0.72)',
                  textDecoration: 'none',
                  fontSize: '1.08rem',
                  fontWeight: 500,
                  fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
                  transition: 'color 0.15s, background 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.color = 'white';
                  el.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.color = 'rgba(255,255,255,0.72)';
                  el.style.background = 'transparent';
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ━━━ 오른쪽: Get Started 버튼 ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',  /* 오른쪽 정렬 */
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Get Started — 강조 버튼 */}
          <Link
            href="#start"
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background:
                'linear-gradient(135deg, rgba(167,139,250,0.40), rgba(56,189,248,0.30))',
              color: 'white',
              textDecoration: 'none',
              fontSize: '1.05rem',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.22), 0 4px 16px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(4px)',
              transition: 'box-shadow 0.15s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow =
                'inset 0 0 0 1px rgba(255,255,255,0.38), 0 6px 24px rgba(0,0,0,0.35)';
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow =
                'inset 0 0 0 1px rgba(255,255,255,0.22), 0 4px 16px rgba(0,0,0,0.25)';
              el.style.transform = 'translateY(0)';
            }}
          >
            Get Started →
          </Link>

          {/* 모바일 햄버거 버튼 (768px 이하에서만 표시) */}
          <button
            className="nav-hamburger"
            aria-label="메뉴 열기"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 0,
            }}
          >
            <HamburgerIcon />
          </button>
        </div>
      </nav>

      {/* 반응형: 768px 이하에서 중앙 링크 숨기고 햄버거 표시 */}
      <style>{`
        @media (max-width: 768px) {
          .nav-center-links { display: none !important; }
          .nav-hamburger    { display: block !important; }
        }
      `}</style>
    </header>
  );
}
