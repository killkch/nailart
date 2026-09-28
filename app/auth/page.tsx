/**
 * /app/auth/page.tsx
 *
 * Google 로그인 전용 Auth 페이지 (디자인 전용)
 * - 랜딩 페이지와 동일한 WebGL 셰이더 배경 유지 (AetherHero 재사용)
 * - 중앙에 글라스모피즘 카드 오버레이
 * - Google SVG 로고 직접 사용 (아이콘 라이브러리 미사용)
 */

import AetherHero from '@/components/ui/aether-hero';
import Image from 'next/image';
import Link from 'next/link';

// ── Google "G" 공식 SVG 로고 (아이콘 라이브러리 미사용) ──────
function GoogleLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── 로그인 카드 (글라스모피즘) ────────────────────────────────
function LoginCard() {
  return (
    /*
      절대 위치로 화면 정중앙에 배치
      WebGL 캔버스(z-index: default) 위, 콘텐츠 레이어(z-index: 2) 위
    */
    <div
      className="
        absolute inset-0
        flex items-center justify-center
        z-10 px-4
      "
    >
      <div
        className="
          relative
          w-full max-w-[420px]
          rounded-2xl p-8
          flex flex-col items-center gap-6
        "
        style={{
          /* 글라스모피즘 카드 스타일 */
          background: 'rgba(10, 10, 20, 0.65)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* ── X 닫기 버튼 — 좌상단, 홈으로 이동 ─────────────── */}
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="
            absolute top-4 left-4
            w-8 h-8
            flex items-center justify-center
            rounded-full
            text-white/50
            transition-all duration-150
            hover:text-white hover:bg-white/10
          "
        >
          {/* X 아이콘 (순수 SVG, 아이콘 라이브러리 미사용) */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 2L14 14M14 2L2 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        {/* ── 로고 + 서비스명 ─────────────────────────────────── */}
        <Link href="/" className="flex flex-col items-center gap-3 no-underline">
          <Image
            src="/nailart01.png"
            alt="NailArt-AI 로고"
            width={56}
            height={56}
            className="rounded-xl object-cover shadow-lg"
            priority
          />
          <span className="text-[1.4rem] font-bold text-white tracking-tight">
            NailArt
            <span className="bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">
              -AI
            </span>
          </span>
        </Link>

        {/* ── 구분선 ──────────────────────────────────────────── */}
        <div className="w-full h-px bg-white/10" />

        {/* ── 환영 문구 ───────────────────────────────────────── */}
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="text-[1.5rem] font-bold text-white tracking-tight m-0">
            시작하기
          </h1>
          <p className="text-[1.05rem] text-white/55 m-0 leading-relaxed">
            Google 계정으로 로그인하고<br />
            AI 썸네일을 무료로 만들어보세요.
          </p>
        </div>

        {/* ── Google 로그인 버튼 ──────────────────────────────── */}
        <button
          type="button"
          disabled
          className="
            w-full flex items-center justify-center gap-3
            py-3 px-5 rounded-xl
            bg-white text-[#1a1a1a]
            text-[0.95rem] font-semibold
            cursor-pointer
            shadow-md
            transition-all duration-150
            hover:shadow-lg hover:-translate-y-px
            active:translate-y-0
            disabled:opacity-70 disabled:cursor-not-allowed
          "
          aria-label="Google 계정으로 로그인"
        >
          <GoogleLogo />
          <span>Google로 계속하기</span>
        </button>

        {/* ── 하단 안내 텍스트 ─────────────────────────────────── */}
        <p className="text-xs text-white/35 text-center leading-relaxed m-0">
          계속 진행하면 NailArt-AI의{' '}
          <Link href="#" className="text-white/55 underline underline-offset-2 hover:text-white/80 transition-colors">
            서비스 이용약관
          </Link>{' '}
          및{' '}
          <Link href="#" className="text-white/55 underline underline-offset-2 hover:text-white/80 transition-colors">
            개인정보 처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function AuthPage() {
  return (
    /*
      AetherHero를 배경으로 사용 (WebGL 셰이더 동일하게 유지)
      - title / subtitle / ctaLabel 비워서 기본 텍스트 숨김
      - children 슬롯에 LoginCard를 주입
    */
    <AetherHero
      title=""
      subtitle=""
      ctaLabel=""
      overlayGradient="linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)"
      height="100vh"
      ariaLabel="NailArt-AI 로그인 페이지 배경"
    >
      <LoginCard />
    </AetherHero>
  );
}
