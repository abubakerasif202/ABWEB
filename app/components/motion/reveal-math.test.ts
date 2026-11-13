import test from "node:test";
import assert from "node:assert/strict";
import { shouldRevealImmediately, staggerDelayMs } from "./reveal-math";

test("staggerDelayMs computes bounded stagger offsets", () => {
  assert.equal(staggerDelayMs(0), 0);
  assert.equal(staggerDelayMs(1), 55);
  assert.equal(staggerDelayMs(3), 165);
  assert.equal(staggerDelayMs(6), 330);
  assert.equal(staggerDelayMs(10), 330);
  assert.equal(staggerDelayMs(-2), 0);
  assert.equal(staggerDelayMs(Number.NaN), 0);
});

test("shouldRevealImmediately respects viewport bounds, intersection, and focus", () => {
  assert.equal(
    shouldRevealImmediately({ isIntersecting: true, top: 1200, innerHeight: 900, hasBounds: true, hasFocus: false }),
    true,
  );
  assert.equal(
    shouldRevealImmediately({ isIntersecting: false, top: 1200, innerHeight: 900, hasBounds: true, hasFocus: true }),
    true,
  );
  assert.equal(
    shouldRevealImmediately({ isIntersecting: false, top: 500, innerHeight: 900, hasBounds: true, hasFocus: false }),
    true,
  );
  assert.equal(
    shouldRevealImmediately({ isIntersecting: false, top: 900, innerHeight: 900, hasBounds: true, hasFocus: false }),
    false,
  );
  assert.equal(
    shouldRevealImmediately({ isIntersecting: false, top: 0, innerHeight: 900, hasBounds: false, hasFocus: false }),
    false,
  );
});
