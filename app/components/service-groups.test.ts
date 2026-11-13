import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { servicePages } from "../services/service-data";
import { groupServiceItems } from "./service-groups";

describe("groupServiceItems", () => {
  it("groups all canonical services into non-empty capability groups with sequential indices", () => {
    const { groups, orderedItems } = groupServiceItems(servicePages);

    assert.equal(groups.length, 3);
    assert.deepEqual(
      groups.map((group) => group.id),
      ["flagships-brand", "visibility-demand", "systems-care"],
    );

    assert.equal(orderedItems.length, servicePages.length);
    const inputSlugs = new Set(servicePages.map((s) => s.slug));
    const outputSlugs = new Set(orderedItems.map((s) => s.slug));
    assert.deepEqual(outputSlugs, inputSlugs);

    const flatEntries = groups.flatMap((g) => g.entries);
    assert.deepEqual(
      flatEntries.map((entry) => entry.globalIndex),
      [0, 1, 2, 3, 4, 5, 6],
    );
    assert.deepEqual(
      flatEntries.map((entry) => entry.displayNumber),
      ["01", "02", "03", "04", "05", "06", "07"],
    );
  });

  it("omits empty groups when given a filtered subset", () => {
    const subset = servicePages.filter((s) =>
      s.slug === "seo-local-visibility" || s.slug === "website-maintenance"
    );

    const { groups, orderedItems } = groupServiceItems(subset);

    assert.equal(groups.length, 2);
    assert.deepEqual(
      groups.map((g) => g.id),
      ["visibility-demand", "systems-care"],
    );
    assert.deepEqual(
      groups.flatMap((g) => g.entries.map((e) => e.displayNumber)),
      ["01", "02"],
    );
    assert.equal(orderedItems.length, 2);
  });

  it("places unmapped service slugs into a fallback group instead of dropping them", () => {
    const customItems = [
      { slug: "web-design-sydney", name: "Web Design" },
      { slug: "bespoke-consulting", name: "Consulting" },
    ];

    const { groups, orderedItems } = groupServiceItems(customItems);

    assert.equal(groups.length, 2);
    assert.equal(groups[1]?.id, "additional-services");
    assert.equal(groups[1]?.entries[0]?.item.slug, "bespoke-consulting");
    assert.equal(groups[1]?.entries[0]?.displayNumber, "02");
    assert.equal(orderedItems.length, 2);
  });
});
