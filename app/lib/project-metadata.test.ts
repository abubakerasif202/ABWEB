import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findProject, projects, type Project } from "../project-data";
import { siteConfig } from "../site-config";
import {
  buildProjectKeywords,
  buildProjectMetadata,
  buildProjectSchema,
  buildProjectSeoDescription,
  buildProjectSeoImages,
  buildProjectSeoTitle,
  getProjectArtworkDimensions,
} from "./project-metadata";

describe("dynamic project metadata generator", () => {
  it("returns an empty metadata object when the project slug does not exist", () => {
    assert.deepEqual(buildProjectMetadata("non-existent-project-slug"), {});
    assert.deepEqual(buildProjectMetadata(undefined), {});
  });

  it("preserves explicit seoTitle and seoDescription when defined on a project", () => {
    const jufaja: Project | undefined = findProject("jufaja-homes");
    assert.ok(jufaja);

    const metadata = buildProjectMetadata(jufaja);
    assert.equal(metadata.title, jufaja.seoTitle);
    assert.equal(metadata.description, jufaja.seoDescription);
    assert.equal(
      metadata.openGraph?.title,
      `${jufaja.seoTitle} | ${siteConfig.name}`,
    );
    assert.equal(metadata.openGraph?.description, jufaja.seoDescription);
  });

  it("generates tailored title and enriched description from project data when explicit SEO overrides are absent", () => {
    const zqRemovals: Project | undefined = findProject("zq-removals");
    assert.ok(zqRemovals);
    assert.equal(zqRemovals.seoTitle, undefined);
    assert.equal(zqRemovals.seoDescription, undefined);

    const title = buildProjectSeoTitle(zqRemovals);
    assert.equal(title, "ZQ Removals — Services · Removals Case Study");

    const description = buildProjectSeoDescription(zqRemovals);
    assert.ok(
      description.startsWith(zqRemovals.description),
      "Expected description to start with project.description",
    );
    assert.ok(
      description.length > zqRemovals.description.length,
      "Expected short project description to be enriched with overview details",
    );
    assert.ok(
      description.length <= 160,
      `Expected description length <= 160, got ${description.length}`,
    );
  });

  it("fetches project primary image, gallery shots, and dimensions from project data", () => {
    const wildPest: Project | undefined = findProject("wild-pest-solutions");
    assert.ok(wildPest);

    const images = buildProjectSeoImages(wildPest);
    assert.ok(images.length >= 5, "Expected primary image, gallery shots, and OG route");
    assert.deepEqual(images[0], {
      url: wildPest.image,
      width: 1440,
      height: 1000,
      alt: wildPest.alt,
    });

    // Verify gallery shots from project data are included
    for (const shot of wildPest.gallery ?? []) {
      assert.ok(
        images.some((img) => img.url === shot.src && img.alt === shot.alt),
        `Expected gallery image ${shot.src} to be included in project SEO images`,
      );
    }

    // Verify fallback dynamic OG image route is also present
    assert.ok(
      images.some(
        (img) => img.url === "/work/wild-pest-solutions/opengraph-image",
      ),
    );
  });

  it("produces complete tailored SEO tags for every project in project-data.ts", () => {
    assert.ok(projects.length >= 16);

    for (const item of projects) {
      const project: Project = item;
      const metadata = buildProjectMetadata(project.slug);
      const dims = getProjectArtworkDimensions(project);
      const expectedTitleFragment = project.seoTitle ?? project.name;

      assert.ok(
        typeof metadata.title === "string" &&
          metadata.title.includes(expectedTitleFragment),
        `Expected title for ${project.slug} to include ${expectedTitleFragment}`,
      );
      assert.ok(
        typeof metadata.description === "string" &&
          metadata.description.length >= 70,
        `Expected rich description for ${project.slug}, got: ${metadata.description}`,
      );
      assert.equal(metadata.alternates?.canonical, `/work/${project.slug}`);

      const keywords = buildProjectKeywords(project);
      assert.ok(keywords.includes(project.name));
      assert.ok(
        keywords.some((k) => k.toLowerCase() === project.sector.toLowerCase()),
      );
      for (const tag of project.tags) {
        assert.ok(
          keywords.some((k) => k.toLowerCase() === tag.toLowerCase()),
          `Expected keywords for ${project.slug} to include tag "${tag}"`,
        );
      }

      const ogImages = Array.isArray(metadata.openGraph?.images)
        ? metadata.openGraph.images
        : [];
      assert.ok(ogImages.length >= 2);
      assert.deepEqual(ogImages[0], {
        url: project.image,
        width: dims.width,
        height: dims.height,
        alt: project.alt,
      });

      const schema = buildProjectSchema(project);
      const creativeWork = schema["@graph"][0];
      assert.equal(creativeWork["@type"], "CreativeWork");
      assert.equal(
        creativeWork.url,
        `${siteConfig.url}/work/${project.slug}`,
      );
      assert.ok(
        Array.isArray(creativeWork.image) &&
          creativeWork.image.includes(`${siteConfig.url}${project.image}`),
      );
    }
  });
});
