/**
 * LandingHero — 이전 버전 (AetherHero 기본 텍스트만 교체)
 *
 * WebGL 셰이더 배경은 그대로 유지하고
 * title, subtitle, CTA 텍스트만 NailArt-AI에 맞게 수정합니다.
 */

import AetherHero from '@/components/ui/aether-hero';

export default function LandingHero() {
  return (
    <AetherHero
      title="Build launch-grade Thumbnails in seconds."
      subtitle="AI-powered YouTube thumbnail generator. Drop your topic and get stunning, click-worthy visuals instantly."
      ctaLabel="Get Started — it's free"
      ctaHref="#start"
      secondaryCtaLabel="View Demo"
      secondaryCtaHref="#demo"
      align="left"
      overlayGradient="linear-gradient(180deg, #000000bb 0%, #00000055 40%, transparent)"
    />
  );
}
