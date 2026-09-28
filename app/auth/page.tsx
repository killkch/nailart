'use client';

/**
 * /app/auth/page.tsx  — 리디자인
 *
 * 레이아웃: 3 : 2 좌우 분할
 * ┌──────────────────────────┬────────────────┐
 * │  왼쪽 (3/5)              │ 오른쪽 (2/5)   │
 * │  • 반투명 검은 오버레이   │  로그인 카드   │
 * │  • 유튜브 영상 (상단)     │                │
 * │  • "Nailart" 대형 텍스트  │                │
 * └──────────────────────────┴────────────────┘
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ──────────────────────────────────────────────────────────────
// ★ 유튜브 영상 ID — 원하는 영상으로 교체하세요
//   예: https://www.youtube.com/watch?v=XXXXXXXXXXX
//       → YOUTUBE_VIDEO_ID = 'XXXXXXXXXXX'
// ──────────────────────────────────────────────────────────────
const YOUTUBE_VIDEO_ID = 'BSFNl4roGlI';

// ── Google "G" 공식 SVG 로고 ─────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── 로딩 스피너 ───────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── 왼쪽 패널: 유튜브 + 대형 타이틀 ─────────────────────────
function LeftPanel() {
  return (
    <div
      className="relative hidden md:flex flex-col justify-between overflow-hidden"
      style={{ flex: '3' }}
    >
      {/* ── 배경: 짙은 다크 그라디언트 ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(160deg, #050508 0%, #0d0d1a 50%, #080812 100%)',
        }}
      />

      {/* ── 반투명 검은 오버레이 (영상 위에) ── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.38)' }}
      />

      {/* ── 장식용 글로우 원 ── */}
      <div
        className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-80px] right-[-60px] w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* ── 상단: 유튜브 영상 (로고 제거됨) ── */}
      <div className="relative z-[3] flex flex-col p-10 pt-12">

        {/* 유튜브 영상 임베드 */}
        <div
          className="w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{
            aspectRatio: '16/9',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/*
            YouTube autoplay 재생 요건:
            - autoplay=1 : 자동 재생 요청
            - mute=1     : 음소거 (브라우저 autoplay 정책 충족 필수)
            - controls=1 : 컨트롤 표시 (없으면 일부 브라우저가 차단)
            - loop=1 + playlist=ID : 반복 재생
            - enablejsapi=1 : JS API 허용 (추가 재생 안정성)
            allow 속성에 반드시 autoplay 포함 필요
          */}
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`}
            title="NailArt-AI 소개 영상"
            allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* ── 하단: 대형 디스플레이 타이틀 ── */}
      <div className="relative z-[3] px-10 pb-10">
        {/*
          Oversized display font:
          - font-size: clamp(5rem, 8vw, 9rem) — 뷰포트에 따라 유동적으로 조정
          - leading-none: 줄간격 제거
          - 그라디언트 + 글로우 효과
        */}
        <p
          className="m-0 font-black leading-none tracking-tighter select-none"
          style={{
            fontSize: 'clamp(4.5rem, 7.5vw, 8.5rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #A78BFA 40%, #38BDF8 80%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 40px rgba(167,139,250,0.35))',
            letterSpacing: '-0.04em',
          }}
        >
          Nailart
        </p>
        <p
          className="mt-2 text-white/40 font-medium tracking-wide"
          style={{ fontSize: 'clamp(0.85rem, 1.2vw, 1.1rem)' }}
        >
          AI가 만드는 유튜브 썸네일, 지금 무료로 시작하세요
        </p>
      </div>
    </div>
  );
}

// ── 오른쪽 패널: 로그인 카드 ─────────────────────────────────
function RightPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // ── 이미 로그인된 사용자는 대시보드로 자동 이동 ──────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setErrorMsg(`로그인 오류: ${error.message}`);
        setIsLoading(false);
        return;
      }
      if (!data?.url) {
        setErrorMsg('로그인 URL을 받지 못했습니다. 잠시 후 다시 시도해주세요.');
        setIsLoading(false);
      }
      // 성공: 브라우저가 구글 페이지로 이동 (isLoading 유지)
    } catch (err) {
      setErrorMsg(`오류: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center px-6 py-12"
      style={{
        flex: '2',
        background: 'linear-gradient(180deg, #0a0a14 0%, #06060f 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── 로그인 카드 ── */}
      <div
        className="w-full flex flex-col items-center gap-6"
        style={{ maxWidth: '380px' }}
      >
        {/* 모바일에서만 보이는 로고 (왼쪽 패널이 hidden md:flex이므로) */}
        <Link href="/" className="flex md:hidden items-center gap-2.5 no-underline mb-2">
          <Image src="/nailart01.png" alt="로고" width={32} height={32} className="rounded-lg" />
          <span className="text-white font-bold text-lg">
            NailArt<span className="bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">-AI</span>
          </span>
        </Link>

        {/* ── 헤드 카피 ── */}
        <div className="text-center flex flex-col gap-2">
          <h1
            className="text-white font-bold m-0 tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)' }}
          >
            시작하기
          </h1>
          <p className="text-white/50 m-0 text-[0.95rem] leading-relaxed">
            Google 계정으로 로그인하고<br />
            AI 썸네일을 무료로 만들어보세요.
          </p>
        </div>

        {/* ── 구분선 ── */}
        <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* ── 에러 메시지 ── */}
        {errorMsg && (
          <div
            className="w-full px-4 py-3 rounded-xl text-sm text-red-300 text-center"
            style={{
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.22)',
            }}
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        {/* ── Google 로그인 버튼 ── */}
        <button
          id="google-login-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="
            w-full flex items-center justify-center gap-3
            py-3.5 px-5 rounded-xl
            bg-white text-[#111]
            text-[0.95rem] font-semibold
            cursor-pointer shadow-lg
            transition-all duration-200
            hover:shadow-xl hover:-translate-y-0.5
            active:translate-y-0
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          aria-label="Google 계정으로 로그인"
        >
          {isLoading ? <LoadingSpinner /> : <GoogleLogo />}
          <span>{isLoading ? '로그인 중...' : 'Google로 계속하기'}</span>
        </button>

        {/* ── 구분 OR ── */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-white/25 text-xs">또는</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* ── 추가 혜택 뱃지 ── */}
        <div
          className="w-full rounded-xl p-4 flex flex-col gap-2.5"
          style={{
            background: 'rgba(167,139,250,0.06)',
            border: '1px solid rgba(167,139,250,0.15)',
          }}
        >
          {[
            { icon: '✨', text: 'AI 썸네일 무제한 생성' },
            { icon: '⚡', text: '2초 만에 결과물 완성' },
            { icon: '🎨', text: '100+ 스타일 템플릿' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <span className="text-base">{icon}</span>
              <span className="text-white/60 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* ── 하단 약관 ── */}
        <p className="text-[0.72rem] text-white/25 text-center leading-relaxed m-0">
          계속 진행하면 NailArt-AI의{' '}
          <Link href="#" className="text-white/45 underline underline-offset-2 hover:text-white/70 transition-colors">
            서비스 이용약관
          </Link>{' '}
          및{' '}
          <Link href="#" className="text-white/45 underline underline-offset-2 hover:text-white/70 transition-colors">
            개인정보 처리방침
          </Link>
          에 동의하게 됩니다.
        </p>

        {/* ── 홈으로 돌아가기 ── */}
        <Link
          href="/"
          className="text-white/30 text-xs hover:text-white/60 transition-colors no-underline flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function AuthPage() {
  return (
    /*
      전체 뷰포트를 차지하는 flex row 레이아웃
      - 왼쪽 (flex:3): 유튜브 + 대형 타이틀
      - 오른쪽 (flex:2): 로그인 카드
    */
    <main
      className="flex w-full pt-16"
      style={{ minHeight: '100vh' }}
      aria-label="NailArt-AI 로그인 페이지"
    >
      <LeftPanel />
      <RightPanel />
    </main>
  );
}
