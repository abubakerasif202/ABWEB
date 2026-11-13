import type { CSSProperties } from "react";

export type HeroOpeningBeatId =
  | "grid"
  | "line1"
  | "line2"
  | "line3"
  | "line4"
  | "datumRule"
  | "tagline"
  | "intro"
  | "actions"
  | "confidence"
  | "ticker";

export interface HeroOpeningBeatSpec {
  delayMs: number;
  durationMs: number;
}

/**
 * Choreographed entrance timing for the homepage hero stage.
 * Core content settles within ~1.25s while remaining interactive and legible
 * from frame zero (compositor transforms & opacity only).
 */
export const HERO_OPENING_BEATS: Readonly<Record<HeroOpeningBeatId, HeroOpeningBeatSpec>> = {
  grid: { delayMs: 0, durationMs: 1100 },
  line1: { delayMs: 40, durationMs: 820 },
  line2: { delayMs: 130, durationMs: 820 },
  line3: { delayMs: 220, durationMs: 840 },
  line4: { delayMs: 310, durationMs: 860 },
  datumRule: { delayMs: 260, durationMs: 820 },
  tagline: { delayMs: 340, durationMs: 720 },
  intro: { delayMs: 420, durationMs: 740 },
  actions: { delayMs: 500, durationMs: 740 },
  confidence: { delayMs: 580, durationMs: 680 },
  ticker: { delayMs: 520, durationMs: 800 },
} as const;

export const HERO_OPENING_SETTLE_MS = Math.max(
  ...Object.values(HERO_OPENING_BEATS).map((beat) => beat.delayMs + beat.durationMs),
);

export type HeroBeatStyle = CSSProperties & {
  "--hero-delay"?: string;
  "--hero-duration"?: string;
};

/**
 * Returns deterministic CSS custom properties (`--hero-delay`, `--hero-duration`)
 * for a named beat in the hero opening sequence.
 */
export function getHeroBeatStyle(beatId: HeroOpeningBeatId): HeroBeatStyle {
  const beat = HERO_OPENING_BEATS[beatId];
  return {
    "--hero-delay": `${beat.delayMs}ms`,
    "--hero-duration": `${beat.durationMs}ms`,
  };
}
