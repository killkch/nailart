/**
 * lib/utils.ts
 *
 * 공통 유틸리티 함수
 */

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
