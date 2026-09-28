'use client';

/**
 * components/ui/border-beam.tsx
 *
 * Magic UI - Border Beam 컴포넌트 (강력하고 확실한 CSS 애니메이션 버전)
 * ─────────────────────────────────────────────────────────────
 * 컨테이너 요소의 테두리를 따라 부드럽게 회전하는 빛의 빔 효과를 연출합니다.
 * - CSS offset-path + 순수 CSS Keyframe 기반으로 100% 끊김 없이 60fps 회전 보장
 * - rect()의 올바른 CSS round 값 처리 (기본 24px / 둥근 곡률 완전 호환)
 * - reverse, delay, duration, size, borderWidth, 커스텀 className 지원
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface BorderBeamProps {
  /** 빔의 크기 (길이, 기본값: 250) */
  size?: number;
  /** 한 바퀴 회전하는 데 걸리는 시간 (초, 기본값: 4) */
  duration?: number;
  /** 애니메이션 시작 지연 시간 (초, 기본값: 0) */
  delay?: number;
  /** 그라디언트 시작 색상 */
  colorFrom?: string;
  /** 그라디언트 끝 색상 */
  colorTo?: string;
  /** 역방향 회전 여부 */
  reverse?: boolean;
  /** 테두리 빔 두께 (px, 기본값: 2) */
  borderWidth?: number;
  /** 테두리 둥글기 (px, 기본값: 24) */
  borderRadius?: number;
  /** 추가 클래스명 (예: from-transparent via-green-500 to-transparent) */
  className?: string;
  /** 인라인 스타일 */
  style?: React.CSSProperties;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 250,
  delay = 0,
  duration = 4,
  colorFrom = '#A78BFA',
  colorTo = '#38BDF8',
  reverse = false,
  borderWidth = 2,
  borderRadius = 24,
  style,
}) => {
  const hasCustomGradient =
    className &&
    (className.includes('from-') || className.includes('via-') || className.includes('to-'));

  const animationName = reverse ? 'borderBeamReverse' : 'borderBeamNormal';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
      style={
        {
          padding: `${borderWidth}px`,
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        } as React.CSSProperties
      }
    >
      {/* 
        Keyframes를 인라인 스타일로 제공하여 어떤 번들러/CSS 환경에서도 100% 확실하게 동작하도록 보장합니다.
      */}
      <style>{`
        @keyframes borderBeamNormal {
          0% {
            offset-distance: 0%;
          }
          100% {
            offset-distance: 100%;
          }
        }
        @keyframes borderBeamReverse {
          0% {
            offset-distance: 100%;
          }
          100% {
            offset-distance: 0%;
          }
        }
      `}</style>

      <div
        className={cn(
          'absolute aspect-square',
          !hasCustomGradient && 'bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent',
          hasCustomGradient && 'bg-gradient-to-l',
          className
        )}
        style={
          {
            width: `${size}px`,
            offsetPath: `rect(0 auto auto 0 round ${borderRadius}px)`,
            animationName,
            animationDuration: `${duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${-delay}s`,
            '--color-from': colorFrom,
            '--color-to': colorTo,
            ...style,
          } as React.CSSProperties
        }
      />
    </div>
  );
};

export default BorderBeam;
