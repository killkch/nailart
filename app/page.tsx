/**
 * 홈(랜딩) 페이지
 *
 * LandingHero 컴포넌트를 메인 섹션으로 사용합니다.
 * 이후에 Features, Pricing 등 추가 섹션을 아래에 붙여 넣으면 됩니다.
 */

import LandingHero from '@/components/main/hero/LandingHero';
import FeaturesSection from '@/components/main/features/FeaturesSection';
import PricingSection from '@/components/main/pricing/PricingSection';
import CtaSection from '@/components/main/cta/CtaSection';
import FooterSection from '@/components/main/footer/FooterSection';

export default function Home() {
  return (
    <main className="w-full bg-[#050508] overflow-x-hidden">
      {/* 히어로 섹션: WebGL 셰이더 배경 + 카피 + CTA */}
      <LandingHero />

      {/* 피처 섹션: 5종의 썸네일 쇼케이스 벤토 그리드 */}
      <FeaturesSection />

      {/* 요금제 섹션: Pro & Ultra 2종 카드 뷰 */}
      <PricingSection />

      {/* 최종 전환 CTA 섹션: 박스 형태 & BorderBeam */}
      <CtaSection />

      {/* 하단 박스 형태 프리미엄 푸터 */}
      <FooterSection />
    </main>
  );
}
