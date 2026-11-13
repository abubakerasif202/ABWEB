import {
  Layers,
  LayoutTemplate,
  Palette,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type ServiceIconKey =
  | "web-design-sydney"
  | "ecommerce-website-development"
  | "seo-local-visibility"
  | "branding-content"
  | "digital-marketing"
  | "website-maintenance"
  | "custom-software-business-systems";

export const SERVICE_ICON_MAP: Record<ServiceIconKey, LucideIcon> = {
  "web-design-sydney": LayoutTemplate,
  "ecommerce-website-development": ShoppingBag,
  "branding-content": Palette,
  "seo-local-visibility": SearchCheck,
  "digital-marketing": Target,
  "custom-software-business-systems": Workflow,
  "website-maintenance": ShieldCheck,
};

/**
 * Resolves a unique, thematic Lucide SVG icon component for each canonical
 * service slug, falling back cleanly to `Layers` for any unmapped slug.
 */
export function getServiceIcon(slug: string): LucideIcon {
  if (Object.prototype.hasOwnProperty.call(SERVICE_ICON_MAP, slug)) {
    return SERVICE_ICON_MAP[slug as ServiceIconKey];
  }
  return Layers;
}
