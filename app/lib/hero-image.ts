export interface ImageLoadingOptions {
  priority?: boolean;
  eager?: boolean;
}

export interface ImageLoadingAttributes {
  preload: boolean;
  loading: "eager" | "lazy";
  fetchPriority: "high" | undefined;
}

export type ImageSkeletonState = "loading" | "loaded" | "error";

/**
 * Resolves Next.js 16 `<Image>` attributes so hero imagery preloads and fetches
 * eagerly at high priority without mixing deprecated `priority` or conflicting
 * `loading="lazy"` props.
 */
export function resolveImageLoadingStrategy({
  priority = false,
  eager = false,
}: ImageLoadingOptions = {}): ImageLoadingAttributes {
  if (priority) {
    return {
      preload: true,
      loading: "eager",
      fetchPriority: "high",
    };
  }

  return {
    preload: false,
    loading: eager ? "eager" : "lazy",
    fetchPriority: undefined,
  };
}

export function getImageSkeletonState(loaded: boolean, errored = false): ImageSkeletonState {
  if (errored) return "error";
  return loaded ? "loaded" : "loading";
}

export type ProjectArtworkSlot =
  | "home-showcase"
  | "home-index-preview"
  | "work-index-feature"
  | "work-index-card"
  | "case-study-hero"
  | "case-study-detail"
  | "case-study-next"
  | "service-hero"
  | "service-proof"
  | "service-index-panel"
  | "about-collage"
  | "preview-grid";

export interface ProjectArtworkPriorityContext {
  isFirst?: boolean;
  isUnfiltered?: boolean;
}

/**
 * Restricts `priority` (`preload` + `fetchPriority="high"`) strictly to genuine
 * LCP artwork slots (case study and service heroes, plus the unfiltered lead
 * feature card on the work index) so below-the-fold and home thumbnail captures
 * never compete with initial-paint webfonts or true LCP elements.
 */
export function shouldPrioritizeProjectArtwork(
  slot: ProjectArtworkSlot,
  { isFirst = false, isUnfiltered = true }: ProjectArtworkPriorityContext = {},
): boolean {
  switch (slot) {
    case "case-study-hero":
    case "service-hero":
      return true;
    case "work-index-feature":
      return isFirst && isUnfiltered;
    case "home-showcase":
    case "home-index-preview":
    case "work-index-card":
    case "case-study-detail":
    case "case-study-next":
    case "service-proof":
    case "service-index-panel":
    case "about-collage":
    case "preview-grid":
      return false;
  }
}
