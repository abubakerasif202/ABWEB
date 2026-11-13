import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Layers } from "lucide-react";
import { servicePages } from "../services/service-data";
import { getServiceIcon } from "./service-icons";

describe("getServiceIcon", () => {
  it("assigns a distinct thematic Lucide icon to every canonical service", () => {
    const resolved = servicePages.map((service) => ({
      slug: service.slug,
      icon: getServiceIcon(service.slug),
    }));

    assert.equal(resolved.length, 7);
    for (const entry of resolved) {
      assert.ok(entry.icon, `Missing icon for ${entry.slug}`);
      assert.notEqual(entry.icon, Layers, `Expected dedicated icon rather than fallback for ${entry.slug}`);
    }

    const uniqueIcons = new Set(resolved.map((entry) => entry.icon));
    assert.equal(uniqueIcons.size, resolved.length, "Every canonical service should map to a unique icon");
  });

  it("returns the fallback Layers icon for unmapped slugs", () => {
    assert.equal(getServiceIcon("unknown-service-slug"), Layers);
  });
});
