import { PriorityImage } from "./components/PriorityImage";
import {
  shouldPrioritizeProjectArtwork,
  type ProjectArtworkSlot,
} from "./lib/hero-image";
import type { Project } from "./project-data";

type Props = {
  project: Project;
  sizes: string;
  slot?: ProjectArtworkSlot;
  priority?: boolean;
  eager?: boolean;
  skeleton?: boolean;
};

/** Intrinsic proportions of the supplied public desktop captures. */
export function projectArtworkRatio(project: Project): string {
  if (["wild-pest-solutions", "pept-up-labs"].includes(project.slug)) return "1440 / 1000";
  if (project.slug === "jufaja-homes") return "16 / 9";
  if (project.slug === "adelaide-wholesale-tyres") return "1440 / 986";
  if (["milestone-renovate", "on-call-trailers"].includes(project.slug)) return "1440 / 900";
  return "1348 / 926";
}

export function ProjectArtwork({
  project,
  sizes,
  slot,
  priority,
  eager = false,
  skeleton,
}: Props) {
  const isPriority = priority ?? (slot ? shouldPrioritizeProjectArtwork(slot) : false);

  return (
    <PriorityImage
      src={project.image}
      alt={project.alt}
      fill
      priority={isPriority}
      eager={eager}
      skeleton={skeleton}
      sizes={sizes}
    />
  );
}
