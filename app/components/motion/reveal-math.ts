/**
 * Pure helpers for staggered viewport reveal timing and initial visibility checks.
 */

export function staggerDelayMs(index: number, stepMs = 55, maxMs = 330): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  if (!Number.isFinite(stepMs) || stepMs <= 0) return 0;
  const raw = Math.floor(index) * stepMs;
  if (!Number.isFinite(maxMs) || maxMs < 0) return raw;
  return Math.min(raw, maxMs);
}

export type InitialRevealGeometry = {
  isIntersecting: boolean;
  top: number;
  innerHeight: number;
  hasBounds: boolean;
  hasFocus: boolean;
};

/**
 * Elements that start above or inside the initial fold—or currently hold focus—
 * are shown immediately without arming an entrance transition.
 */
export function shouldRevealImmediately({
  isIntersecting,
  top,
  innerHeight,
  hasBounds,
  hasFocus,
}: InitialRevealGeometry): boolean {
  if (isIntersecting || hasFocus) return true;
  if (!hasBounds) return false;
  return top < innerHeight * 0.92;
}
