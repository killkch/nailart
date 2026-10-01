'use client';

/**
 * components/main/footer/FooterSection.tsx
 *
 * NailArt-AI 랜딩 페이지 - Footer (하단 푸터) 컴포넌트
 * ─────────────────────────────────────────────────────────────
 * [디자인 및 구조 사양]
 * 1. 하단 박스(Box) 형태: max-w-[1280px], rounded-3xl, bg-[#141518]/85, backdrop-blur-xl
 * 2. 왼쪽 영역:
 *    - 로고 이미지 및 NailArt-AI 서비스명
 *    - 소셜 미디어 아이콘 링크 3종: X (구 트위터), Threads, YouTube
 *    - 저작권 문구: © 2026 NailArt-AI. All rights reserved.
 * 3. 우측 영역:
 *    - 텍스트 전용 링크: Features (#features), Pricing (#pricing), Privacy (/privacy), Terms (/terms)
 */

import React from 'react';
import Link from 'next/link';

// ── X (구 Twitter) 공식 SVG 아이콘 ──
function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ── Threads 공식 SVG 아이콘 ──
function ThreadsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24c-3.535 0-6.425-1.19-8.358-3.44C1.988 18.423 1 15.352 1 11.758 1 8.272 2.012 5.253 3.905 3.02 5.86 0.706 8.675 0 12.278 0c3.702 0 6.55 0.748 8.465 2.223 1.944 1.498 2.977 3.655 2.987 6.237v0.016c0 1.942-0.655 3.64-1.895 4.912-1.22 1.252-2.88 1.94-4.8 1.99-0.088 0.003-0.177 0.004-0.266 0.004-1.42 0-2.653-0.428-3.566-1.238-0.902-0.8-1.436-1.88-1.545-3.125l-0.009-0.173c0.165-2.072 1.704-3.542 3.829-3.66 0.942-0.052 1.837 0.16 2.587 0.615 0.36 0.218 0.665 0.505 0.91 0.852V6.993c-0.672-0.347-1.503-0.54-2.472-0.575-2.87-0.103-5.32 1.298-5.704 3.238-0.29 1.464 0.283 2.878 1.573 3.879 1.155 0.896 2.73 1.34 4.55 1.282 1.332-0.042 2.473-0.528 3.3-1.406 0.812-0.862 1.241-2.03 1.241-3.38v-0.012c-0.008-2.003-0.787-3.64-2.253-4.743-1.516-1.141-3.83-1.743-6.877-1.743-3.02 0-5.342 0.574-6.898 1.705-1.55 1.127-2.372 2.813-2.376 4.877 0 2.235 0.906 4.025 2.62 5.176 1.63 1.095 3.997 1.674 7.034 1.721 1.764 0.027 3.385-0.244 4.819-0.806l0.612 1.954c-1.688 0.674-3.61 0.994-5.707 0.963-3.488-0.054-6.26-0.76-8.24-2.097C2.08 17.59 1 15.352 1 12.015c0-2.613 0.988-4.78 2.857-6.266C5.748 4.246 8.528 3.518 12.106 3.518c3.67 0 6.47 0.74 8.32 2.2 1.83 1.444 2.76 3.495 2.77 6.096v0.018c0 1.986-0.67 3.73-1.94 5.043-1.258 1.3-2.97 2.023-4.95 2.074-0.126 0.003-0.252 0.005-0.378 0.005-1.573 0-2.956-0.5-4.004-1.447-1.04-0.94-1.66-2.233-1.79-3.74v-0.222c0.2-2.457 2.05-4.225 4.603-4.394 1.15-0.076 2.25 0.17 3.18 0.713v2.327c-0.73-0.428-1.59-0.662-2.5-0.662-1.74 0-3.15 1.168-3.3 2.753-0.12 1.267 0.59 2.45 1.86 3.124 1.05 0.557 2.37 0.72 3.72 0.46 1.09-.21 2.02-.75 2.68-1.57.65-.8 1-1.85 1-3.05v-.01c0-1.8-.72-3.23-2.09-4.14-1.39-.92-3.48-1.4-6.21-1.4-2.82 0-4.99.49-6.45 1.45-1.47.97-2.25 2.45-2.25 4.28 0 2.02.83 3.61 2.41 4.61 1.55.98 3.82 1.5 6.74 1.54 1.76.02 3.39-.23 4.84-.75l.65 1.98c-1.74.62-3.69.93-5.8.9z" />
    </svg>
  );
}

// ── YouTube 공식 SVG 아이콘 ──
function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function FooterSection() {
  return (
    <footer className="w-full pt-6 pb-12 sm:pb-16 px-4 sm:px-6 md:px-12 bg-[#050508]">
      {/* ─── 하단 박스(Box) 컨테이너 ─── */}
      <div
        className="
          max-w-[1280px] mx-auto
          rounded-3xl sm:rounded-[32px]
          bg-[#141518]/90 hover:bg-[#18191E]/90
          backdrop-blur-2xl
          p-6 sm:p-10 md:p-12
          shadow-[0_20px_50px_rgba(0,0,0,0.6)]
          transition-all duration-300
        "
      >
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12">
          
          {/* ━━━ 왼쪽 영역: 로고 + 소셜 링크 + 카피라이트 ━━━ */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            {/* 회사 이름 (단순 텍스트) */}
            <Link
              href="/"
              className="text-xl font-bold text-white tracking-tight hover:text-gray-300 transition-colors no-underline"
              aria-label="NailArt-AI 홈으로 이동"
            >
              NailArt-AI
            </Link>

            {/* 소셜 링크: X, Threads, YouTube */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (구 Twitter) 공식 채널"
                className="
                  w-9 h-9 rounded-full
                  bg-white/5 hover:bg-white/15
                  border border-white/10 hover:border-white/25
                  flex items-center justify-center
                  text-gray-400 hover:text-white
                  shadow-sm hover:scale-105 active:scale-95
                  transition-all duration-200
                "
              >
                <XIcon />
              </a>

              <a
                href="https://threads.net"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Threads 공식 채널"
                className="
                  w-9 h-9 rounded-full
                  bg-white/5 hover:bg-white/15
                  border border-white/10 hover:border-white/25
                  flex items-center justify-center
                  text-gray-400 hover:text-white
                  shadow-sm hover:scale-105 active:scale-95
                  transition-all duration-200
                "
              >
                <ThreadsIcon />
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube 공식 채널"
                className="
                  w-9 h-9 rounded-full
                  bg-white/5 hover:bg-white/15
                  border border-white/10 hover:border-white/25
                  flex items-center justify-center
                  text-gray-400 hover:text-red-400
                  shadow-sm hover:scale-105 active:scale-95
                  transition-all duration-200
                "
              >
                <YouTubeIcon />
              </a>
            </div>

            {/* 저작권 문구 */}
            <p className="text-xs text-gray-500 pt-1">
              © 2026 NailArt-AI. All rights reserved.
            </p>
          </div>

          {/* ━━━ 우측 영역: 텍스트 링크 (features, pricing, privacy, terms) ━━━ */}
          <nav
            aria-label="푸터 네비게이션"
            className="flex flex-col items-center md:items-end gap-3 pt-1"
          >
            <Link
              href="#features"
              className="text-sm sm:text-base font-medium text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors duration-150 no-underline"
            >
              Features
            </Link>

            <Link
              href="#pricing"
              className="text-sm sm:text-base font-medium text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors duration-150 no-underline"
            >
              Pricing
            </Link>

            <Link
              href="/privacy"
              className="text-sm sm:text-base font-medium text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors duration-150 no-underline"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="text-sm sm:text-base font-medium text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors duration-150 no-underline"
            >
              Terms
            </Link>
          </nav>

        </div>
      </div>
    </footer>
  );
}
