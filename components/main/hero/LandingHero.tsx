/**
 * LandingHero 컴포넌트
 *
 * 네일아트 썸네일 생성기 랜딩페이지 전용 히어로 섹션입니다.
 * AetherHero(WebGL 셰이더 배경)를 기반으로,
 * 네일아트 서비스에 맞는 텍스트와 CTA를 설정해 사용합니다.
 */

import AetherHero from '@/components/ui/aether-hero';

export default function LandingHero() {
  return (
    <AetherHero
      // ── 메인 카피라이팅 ──
      title="당신의 네일아트, 한 장의 썸네일로."
      subtitle="AI가 생성한 감각적인 썸네일로 네일 디자인을 더 돋보이게 만들어보세요. 몇 초 만에 완성되는 프로페셔널한 결과물."

      // ── CTA 버튼 ──
      ctaLabel="무료로 시작하기"
      ctaHref="#start"
      secondaryCtaLabel="데모 보기"
      secondaryCtaHref="#demo"

      // ── 레이아웃 ──
      align="left"
      height="100vh"

      // ── 오버레이: 왼쪽 텍스트 가독성 향상 ──
      overlayGradient="linear-gradient(105deg, #000000cc 0%, #00000066 50%, transparent 100%)"

      // ── 텍스트 색상 ──
      textColor="#ffffff"

      // ── 접근성 ──
      ariaLabel="네일아트 썸네일 생성기 히어로 배경"
    />
  );
}
