'use client';

/**
 * LandingHero — NailArt-AI 랜딩 히어로 섹션
 *
 * - 로그인 상태: "대시보드 가기" 버튼 표시
 * - 비로그인 상태: "Get Started" → /auth 로 이동
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AetherHero from '@/components/ui/aether-hero';

export default function LandingHero() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 로그인된 사용자: CTA를 /dashboard로 연결
  const isLoggedIn = !loading && !!user;

  return (
    <AetherHero
      title="Build launch-grade Thumbnails in seconds."
      subtitle="AI-powered YouTube thumbnail generator. Drop your topic and get stunning, click-worthy visuals instantly."
      // 로그인 여부에 따라 CTA 텍스트와 링크 변경
      ctaLabel={isLoggedIn ? `${user?.user_metadata?.full_name?.split(' ')[0] || ''}의 대시보드 가기 →` : "Get Started — it's free"}
      ctaHref={isLoggedIn ? '/dashboard' : '/auth'}
      secondaryCtaLabel={isLoggedIn ? undefined : 'View Demo'}
      secondaryCtaHref={isLoggedIn ? undefined : '#demo'}
      align="left"
      overlayGradient="linear-gradient(180deg, #000000bb 0%, #00000055 40%, transparent)"
    />
  );
}
