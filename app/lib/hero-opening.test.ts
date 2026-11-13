import test from "node:test";
import assert from "node:assert/strict";
import {
  HERO_OPENING_BEATS,
  HERO_OPENING_SETTLE_MS,
  getHeroBeatStyle,
} from "./hero-opening";

test("HERO_OPENING_BEATS maintains strict narrative stagger across headline and intro beats", () => {
  assert.ok(HERO_OPENING_BEATS.line1.delayMs < HERO_OPENING_BEATS.line2.delayMs);
  assert.ok(HERO_OPENING_BEATS.line2.delayMs < HERO_OPENING_BEATS.line3.delayMs);
  assert.ok(HERO_OPENING_BEATS.line3.delayMs < HERO_OPENING_BEATS.line4.delayMs);

  assert.ok(HERO_OPENING_BEATS.datumRule.delayMs < HERO_OPENING_BEATS.tagline.delayMs);
  assert.ok(HERO_OPENING_BEATS.tagline.delayMs < HERO_OPENING_BEATS.intro.delayMs);
  assert.ok(HERO_OPENING_BEATS.intro.delayMs < HERO_OPENING_BEATS.actions.delayMs);
  assert.ok(HERO_OPENING_BEATS.actions.delayMs < HERO_OPENING_BEATS.confidence.delayMs);
});

test("HERO_OPENING_BEATS stays within fast visual responsiveness budgets", () => {
  for (const [name, beat] of Object.entries(HERO_OPENING_BEATS)) {
    assert.ok(beat.delayMs >= 0, `${name} delay must be non-negative`);
    assert.ok(beat.durationMs >= 500 && beat.durationMs <= 1200, `${name} duration should feel crisp`);
  }
  assert.ok(HERO_OPENING_SETTLE_MS <= 1500, "hero opening sequence should settle within 1.5s");
});

test("getHeroBeatStyle returns CSS custom properties for each beat", () => {
  assert.deepEqual(getHeroBeatStyle("line1"), {
    "--hero-delay": "40ms",
    "--hero-duration": "820ms",
  });
  assert.deepEqual(getHeroBeatStyle("ticker"), {
    "--hero-delay": "520ms",
    "--hero-duration": "800ms",
  });
});
