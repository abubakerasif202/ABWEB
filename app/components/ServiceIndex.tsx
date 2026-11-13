"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowIcon, Glyph } from "../icons";
import { ProjectArtwork } from "../project-artwork";
import type { Project } from "../project-data";
import { Reveal } from "./motion/Reveal";
import { shouldRevealImmediately, staggerDelayMs } from "./motion/reveal-math";
import { groupServiceItems } from "./service-groups";
import { getServiceIcon } from "./service-icons";

export type ServiceIndexItem = {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  benefits: readonly string[];
  project: Project;
};

type RevealState = "idle" | "armed" | "visible";

function ServiceIndexRevealItem({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const setRevealState = (state: RevealState) => {
      element.setAttribute("data-reveal", state);
    };

    if (!("IntersectionObserver" in window)) {
      setRevealState("visible");
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setRevealState("visible");
      return;
    }

    let initialized = false;
    let revealed = false;
    let rafId = 0;

    const show = () => {
      if (revealed) return;
      revealed = true;
      initialized = true;
      setRevealState("visible");
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };

    const checkPosition = () => {
      if (revealed) return;
      const bounds = element.getBoundingClientRect();
      const hasBounds = bounds.width > 0 || bounds.height > 0;
      if (
        hasBounds &&
        shouldRevealImmediately({
          isIntersecting: false,
          top: bounds.top,
          innerHeight: window.innerHeight,
          hasBounds,
          hasFocus: element.contains(document.activeElement),
        })
      ) {
        show();
      }
    };

    const onScroll = () => {
      if (revealed || rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        checkPosition();
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || revealed) return;
        if (!initialized) {
          initialized = true;
          const bounds = entry.boundingClientRect;
          const hasBounds = bounds.width > 0 || bounds.height > 0;
          if (
            shouldRevealImmediately({
              isIntersecting: entry.isIntersecting,
              top: bounds.top,
              innerHeight: window.innerHeight,
              hasBounds,
              hasFocus: element.contains(document.activeElement),
            })
          ) {
            show();
            return;
          }
          setRevealState("armed");
        }
        if (entry.isIntersecting) show();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    observer.observe(element);
    window.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("focusin", show);
    const handleMotionChange = () => {
      if (motionQuery.matches) show();
    };
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      element.removeEventListener("focusin", show);
      motionQuery.removeEventListener("change", handleMotionChange);
      setRevealState("idle");
    };
  }, []);

  const revealStyle = { "--reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <li ref={ref} className="gr-svc-item" data-reveal="idle" style={revealStyle}>
      {children}
    </li>
  );
}

/* Grouped numbered service index with a sticky preview panel. Related services
   sit under capability headings; hovering or focusing a row expands its brief
   description and swaps the sticky panel to that service's featured project. */
export function ServiceIndex({ items }: { items: readonly ServiceIndexItem[] }) {
  const { groups, orderedItems } = groupServiceItems(items);
  const [active, setActive] = useState(0);

  if (orderedItems.length === 0) return null;

  const safeActive = active < orderedItems.length ? active : 0;
  const current = orderedItems[safeActive];
  const ActiveIcon = getServiceIcon(current.slug);

  return (
    <div className="gr-svc-index">
      <div className="gr-svc-groups">
        {groups.map((group) => {
          const headingId = `svc-group-${group.id}`;
          const startNumber = (group.entries[0]?.globalIndex ?? 0) + 1;

          return (
            <div className="gr-svc-group" role="region" key={group.id} aria-labelledby={headingId}>
              <header className="gr-svc-group-head">
                <div className="gr-svc-group-meta">
                  <div className="gr-svc-group-title-wrap">
                    <span className="gr-svc-group-numeral" aria-hidden="true">{group.numeral}</span>
                    <h3 id={headingId} className="gr-svc-group-title">{group.title}</h3>
                  </div>
                  <span className="gr-svc-group-count">
                    {String(group.entries.length).padStart(2, "0")} {group.entries.length === 1 ? "service" : "services"}
                  </span>
                </div>
                <p className="gr-svc-group-desc">{group.description}</p>
              </header>

              <ol className="gr-svc-list" start={startNumber}>
                {group.entries.map(({ item, globalIndex, displayNumber }) => {
                  const ServiceIcon = getServiceIcon(item.slug);

                  return (
                    <ServiceIndexRevealItem key={item.slug} delay={staggerDelayMs(globalIndex)}>
                      <Link
                        className={`services-index-row gr-svc-row${globalIndex === safeActive ? " is-active" : ""}`}
                        href={`/services/${item.slug}`}
                        onPointerEnter={() => setActive(globalIndex)}
                        onFocus={() => setActive(globalIndex)}
                      >
                        <span className="gr-svc-lead" aria-hidden="true">
                          <span className="gr-svc-num">{displayNumber}</span>
                          <span className="gr-svc-icon">
                            <Glyph icon={ServiceIcon} size={18} />
                          </span>
                        </span>
                        <span className="gr-svc-title">{item.title}</span>
                        <span className="gr-svc-summary-wrap">
                          <span className="gr-svc-summary">
                            <span className="gr-svc-summary-inner">{item.summary}</span>
                          </span>
                        </span>
                        <span className="gr-svc-arrow" aria-hidden="true"><ArrowIcon /></span>
                      </Link>
                    </ServiceIndexRevealItem>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>

      <div className="gr-svc-panel">
        <Reveal variant="fade-up" delay={120}>
          <div className="gr-svc-panel-media gr-cut-lg" aria-hidden="true">
            {orderedItems.map((item, index) => (
              <div className={`gr-svc-panel-image${index === safeActive ? " is-active" : ""}`} key={item.slug}>
                <ProjectArtwork project={item.project} slot="service-index-panel" sizes="(max-width: 960px) 0px, 40vw" />
              </div>
            ))}
          </div>
          <div className="gr-svc-panel-copy" key={current.slug}>
            <p className="gr-kicker gr-svc-panel-kicker">
              <span className="gr-svc-panel-icon" aria-hidden="true">
                <Glyph icon={ActiveIcon} size={14} />
              </span>
              <span className="gr-kicker-num">{String(safeActive + 1).padStart(2, "0")}</span> / As seen in {current.project.name}
            </p>
            <p className="gr-svc-panel-intro">{current.intro}</p>
            <ul>
              {current.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
            <Link className="text-link" href={`/services/${current.slug}`}>
              Explore {current.title} <ArrowIcon />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
