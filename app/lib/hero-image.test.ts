import test from "node:test";
import assert from "node:assert/strict";
import {
  getImageSkeletonState,
  resolveImageLoadingStrategy,
  shouldPrioritizeProjectArtwork,
  type ProjectArtworkSlot,
} from "./hero-image";

test("priority images enable preload, eager loading and high fetchPriority", () => {
  assert.deepEqual(resolveImageLoadingStrategy({ priority: true }), {
    preload: true,
    loading: "eager",
    fetchPriority: "high",
  });
});

test("eager non-priority images use eager loading without preload", () => {
  assert.deepEqual(resolveImageLoadingStrategy({ priority: false, eager: true }), {
    preload: false,
    loading: "eager",
    fetchPriority: undefined,
  });
});

test("default images remain lazy without preload or elevated fetchPriority", () => {
  assert.deepEqual(resolveImageLoadingStrategy(), {
    preload: false,
    loading: "lazy",
    fetchPriority: undefined,
  });
});

test("skeleton state transitions from loading to loaded or error", () => {
  assert.equal(getImageSkeletonState(false, false), "loading");
  assert.equal(getImageSkeletonState(true, false), "loaded");
  assert.equal(getImageSkeletonState(false, true), "error");
  assert.equal(getImageSkeletonState(true, true), "error");
});

test("shouldPrioritizeProjectArtwork enables priority only on primary hero LCP slots", () => {
  assert.equal(shouldPrioritizeProjectArtwork("case-study-hero"), true);
  assert.equal(shouldPrioritizeProjectArtwork("service-hero"), true);
});

test("shouldPrioritizeProjectArtwork prioritizes work-index-feature only when first and unfiltered", () => {
  assert.equal(
    shouldPrioritizeProjectArtwork("work-index-feature", { isFirst: true, isUnfiltered: true }),
    true,
  );
  assert.equal(
    shouldPrioritizeProjectArtwork("work-index-feature", { isFirst: false, isUnfiltered: true }),
    false,
  );
  assert.equal(
    shouldPrioritizeProjectArtwork("work-index-feature", { isFirst: true, isUnfiltered: false }),
    false,
  );
  assert.equal(shouldPrioritizeProjectArtwork("work-index-feature"), false);
});

test("shouldPrioritizeProjectArtwork keeps home, secondary case-study, and preview slots non-priority", () => {
  const nonLcpSlots: ProjectArtworkSlot[] = [
    "home-showcase",
    "home-index-preview",
    "work-index-card",
    "case-study-detail",
    "case-study-next",
    "service-proof",
    "service-index-panel",
    "about-collage",
    "preview-grid",
  ];

  for (const slot of nonLcpSlots) {
    assert.equal(
      shouldPrioritizeProjectArtwork(slot, { isFirst: true, isUnfiltered: true }),
      false,
      `expected ${slot} to remain non-priority`,
    );
  }
});
