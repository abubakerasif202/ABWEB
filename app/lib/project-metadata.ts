import type { Metadata } from "next";
import {
  findProject,
  formatCategory,
  isSoftwareProject,
  type Project,
} from "../project-data";
import { siteConfig } from "../site-config";

export type ProjectSeoImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

const MAX_META_DESCRIPTION_LENGTH = 160;
const MIN_STANDALONE_DESCRIPTION_LENGTH = 110;

export function getProjectArtworkDimensions(project: Project): {
  width: number;
  height: number;
} {
  if (
    project.slug === "wild-pest-solutions" ||
    project.slug === "pept-up-labs"
  ) {
    return { width: 1440, height: 1000 };
  }
  if (project.slug === "jufaja-homes") {
    return { width: 1600, height: 900 };
  }
  if (project.slug === "adelaide-wholesale-tyres") {
    return { width: 1440, height: 986 };
  }
  if (
    project.slug === "milestone-renovate" ||
    project.slug === "on-call-trailers"
  ) {
    return { width: 1440, height: 900 };
  }
  return { width: 1348, height: 926 };
}

function truncateAtWordBoundary(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cutoff = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cutoff.replace(/[.,;:\-–—]+$/, "")}…`;
}

export function buildProjectSeoTitle(project: Project): string {
  const explicitTitle = project.seoTitle?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }
  const categoryLabel = formatCategory(project.category);
  return `${project.name} — ${categoryLabel} Case Study`;
}

export function buildProjectSeoDescription(project: Project): string {
  const explicitDescription = project.seoDescription?.trim();
  if (explicitDescription) {
    return explicitDescription;
  }

  const baseDescription = project.description.trim();
  if (baseDescription.length >= MIN_STANDALONE_DESCRIPTION_LENGTH) {
    return truncateAtWordBoundary(baseDescription, MAX_META_DESCRIPTION_LENGTH);
  }

  const overview = project.overview.trim();
  if (!overview) {
    return baseDescription;
  }

  const combined = baseDescription.endsWith(".")
    ? `${baseDescription} ${overview}`
    : `${baseDescription}. ${overview}`;

  return truncateAtWordBoundary(combined, MAX_META_DESCRIPTION_LENGTH);
}

export function buildProjectSeoImages(project: Project): ProjectSeoImage[] {
  const primaryDimensions = getProjectArtworkDimensions(project);
  const projectType = isSoftwareProject(project) ? "software" : "website";

  const images: ProjectSeoImage[] = [
    {
      url: project.image,
      width: primaryDimensions.width,
      height: primaryDimensions.height,
      alt: project.alt,
    },
  ];

  if (project.gallery && project.gallery.length > 0) {
    for (const shot of project.gallery) {
      if (images.some((existing) => existing.url === shot.src)) {
        continue;
      }
      images.push({
        url: shot.src,
        width: primaryDimensions.width,
        height: primaryDimensions.height,
        alt: shot.alt,
      });
    }
  }

  images.push({
    url: `/work/${project.slug}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${project.name} ${projectType} case study by ${siteConfig.name}`,
  });

  return images;
}

export function buildProjectKeywords(project: Project): string[] {
  const rawKeywords = [
    project.name,
    project.sector,
    formatCategory(project.category),
    isSoftwareProject(project)
      ? "Custom Software Case Study"
      : "Web Design Case Study",
    ...(project.region ? [project.region] : []),
    ...project.tags,
    ...project.techStack,
    siteConfig.name,
  ];

  const seen = new Set<string>();
  const deduplicated: string[] = [];

  for (const item of rawKeywords) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduplicated.push(trimmed);
  }

  return deduplicated;
}

export function buildProjectMetadata(
  slugOrProject: string | Project | undefined,
): Metadata {
  const project =
    typeof slugOrProject === "string"
      ? findProject(slugOrProject)
      : slugOrProject;

  if (!project) {
    return {};
  }

  const title = buildProjectSeoTitle(project);
  const socialTitle = `${title} | ${siteConfig.name}`;
  const description = buildProjectSeoDescription(project);
  const canonicalPath = `/work/${project.slug}`;
  const images = buildProjectSeoImages(project);
  const keywords = buildProjectKeywords(project);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalPath,
      siteName: siteConfig.name,
      type: "article",
      locale: "en_AU",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: images.map((img) => ({
        url: img.url,
        alt: img.alt,
      })),
    },
  };
}

export function buildProjectSchema(project: Project) {
  const softwareProject = isSoftwareProject(project);
  const description = buildProjectSeoDescription(project);
  const imageUrls = [
    `${siteConfig.url}${project.image}`,
    ...(project.gallery?.map((shot) => `${siteConfig.url}${shot.src}`) ?? []),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: `${project.name} ${softwareProject ? "Software" : "Website"} Case Study`,
        headline: buildProjectSeoTitle(project),
        description,
        url: `${siteConfig.url}/work/${project.slug}`,
        image: imageUrls,
        genre: formatCategory(project.category),
        keywords: buildProjectKeywords(project).join(", "),
        author: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Work",
            item: `${siteConfig.url}/work`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.name,
            item: `${siteConfig.url}/work/${project.slug}`,
          },
        ],
      },
    ],
  };
}
