/**
 * 홈(랜딩) 페이지
 *
 * LandingHero 컴포넌트를 메인 섹션으로 사용합니다.
 * 이후에 Features, Pricing 등 추가 섹션을 아래에 붙여 넣으면 됩니다.
 */

import LandingHero from '@/components/main/hero/LandingHero';

export default function Home() {
  return (
    <main>
      {/* 히어로 섹션: WebGL 셰이더 배경 + 카피 + CTA */}
      <LandingHero />

      {/* TODO: Features 섹션, Pricing 섹션 등 추가 예정 */}
    </main>
  );
}
