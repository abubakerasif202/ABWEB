import { ImageResponse } from "next/og";
import { findProject, formatCategory, isSoftwareProject } from "../../project-data";
import { buildProjectSeoDescription } from "../../lib/project-metadata";

export const alt = "AB Web Studio client case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const project = findProject((await params).slug);
  const name = project?.name ?? "Client work";
  const detail = project
    ? `${project.sector} · ${formatCategory(project.category)} · ${isSoftwareProject(project) ? "Custom software" : "Website"} case study`
    : "Case study";
  const summary = project ? buildProjectSeoDescription(project) : "";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "74px 86px", color: "#f8f4ea", background: "radial-gradient(circle at 82% 18%, #5a3c08 0%, #0a0907 42%, #030303 100%)", fontFamily: "Arial, sans-serif" }}>
      <div style={{ color: "#d8aa43", fontSize: 30, letterSpacing: 5 }}>AB WEB STUDIO</div>
      <div style={{ width: 110, height: 4, margin: "28px 0", background: "#d8aa43" }} />
      <div style={{ maxWidth: 980, fontSize: 68, fontWeight: 700, lineHeight: 1.04 }}>{name}</div>
      {summary ? (
        <div style={{ maxWidth: 960, marginTop: 24, color: "#e6e0d2", fontSize: 26, lineHeight: 1.38 }}>{summary}</div>
      ) : null}
      <div style={{ marginTop: 28, color: "#d8aa43", fontSize: 22, letterSpacing: 1.5 }}>{detail}</div>
    </div>,
    size,
  );
}
