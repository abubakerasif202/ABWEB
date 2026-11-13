export type ServiceGroupDefinition = {
  id: string;
  numeral: string;
  title: string;
  description: string;
  slugs: readonly string[];
};

export const SERVICE_GROUP_DEFINITIONS: readonly ServiceGroupDefinition[] = [
  {
    id: "flagships-brand",
    numeral: "I",
    title: "Websites, Stores & Brand",
    description:
      "Public digital flagships, storefronts and cohesive identity systems shaped to turn visitors into enquiries.",
    slugs: [
      "web-design-sydney",
      "ecommerce-website-development",
      "branding-content",
    ],
  },
  {
    id: "visibility-demand",
    numeral: "II",
    title: "Visibility & Campaigns",
    description:
      "Technical search foundations and focused campaign destinations that connect intent to action.",
    slugs: ["seo-local-visibility", "digital-marketing"],
  },
  {
    id: "systems-care",
    numeral: "III",
    title: "Custom Software & Care",
    description:
      "Role-protected web applications and practical ongoing technical care for established sites.",
    slugs: ["custom-software-business-systems", "website-maintenance"],
  },
] as const;

export type GroupedServiceEntry<T> = {
  item: T;
  globalIndex: number;
  displayNumber: string;
};

export type ServiceGroup<T> = {
  id: string;
  numeral: string;
  title: string;
  description: string;
  entries: readonly GroupedServiceEntry<T>[];
};

export type GroupedServicesResult<T> = {
  groups: readonly ServiceGroup<T>[];
  orderedItems: readonly T[];
};

/**
 * Organises flat service items into studio capability groups while preserving
 * a contiguous `globalIndex` for the sticky preview panel and sequential
 * `displayNumber` labels across the entire list. Any slug outside the canonical
 * map is appended safely under "Additional Services" so no service is dropped.
 */
export function groupServiceItems<T extends { slug: string }>(
  items: readonly T[],
  definitions: readonly ServiceGroupDefinition[] = SERVICE_GROUP_DEFINITIONS,
): GroupedServicesResult<T> {
  const bySlug = new Map<string, T>();
  for (const item of items) {
    bySlug.set(item.slug, item);
  }

  const assignedSlugs = new Set<string>();
  const orderedItems: T[] = [];
  const groups: ServiceGroup<T>[] = [];

  for (const definition of definitions) {
    const entries: GroupedServiceEntry<T>[] = [];
    for (const slug of definition.slugs) {
      const item = bySlug.get(slug);
      if (!item || assignedSlugs.has(slug)) continue;
      assignedSlugs.add(slug);
      const globalIndex = orderedItems.length;
      orderedItems.push(item);
      entries.push({
        item,
        globalIndex,
        displayNumber: String(globalIndex + 1).padStart(2, "0"),
      });
    }

    if (entries.length > 0) {
      groups.push({
        id: definition.id,
        numeral: definition.numeral,
        title: definition.title,
        description: definition.description,
        entries,
      });
    }
  }

  const remaining = items.filter((item) => !assignedSlugs.has(item.slug));
  if (remaining.length > 0) {
    const entries: GroupedServiceEntry<T>[] = remaining.map((item) => {
      const globalIndex = orderedItems.length;
      orderedItems.push(item);
      return {
        item,
        globalIndex,
        displayNumber: String(globalIndex + 1).padStart(2, "0"),
      };
    });

    groups.push({
      id: "additional-services",
      numeral: "IV",
      title: "Additional Services",
      description: "Specialised digital capabilities scoped to your brief.",
      entries,
    });
  }

  return { groups, orderedItems };
}
