"use client";

import { useEffect, useState } from "react";

const NAV_LINKS = [
  { id: "pipeline", label: "Pipeline" },
  { id: "markers", label: "Markers" },
  { id: "run", label: "Run" },
  { id: "outputs", label: "Outputs" },
  { id: "integrate", label: "Integrate" },
  { id: "pricing", label: "Pricing" },
];

/**
 * Primary nav with a scroll spy. Hrefs are root-relative (`/#pipeline`) so the
 * same topbar can render on /security or /login and still get you to the right
 * section; from the home page itself the browser treats them as ordinary
 * same-document fragment links. The spy simply finds no sections off-home and
 * leaves every link inactive. Every link on this page is an in-page
 * anchor, so without an active marker the nav is the one element that never
 * tells you where you are in a very long single page.
 *
 * Tracks the section whose top edge is closest to just below the sticky
 * header — rather than "first intersecting" — because several of these
 * sections are tall enough to intersect the viewport at the same time.
 *
 * The active state is carried by colour alone (see `.pm-nav-link`): the
 * previous sliding underline animated `transform` on hover, which the motion
 * system forbids.
 */
export default function NavLinks() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // The sticky header is ~62px; anything above that line is "passed".
      const line = 96;
      let current: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav aria-label="Primary" className="pm-nav-links">
      {NAV_LINKS.map((l) => {
        const isActive = active === l.id;
        return (
          <a key={l.id} href={`/#${l.id}`} className="pm-nav-link" data-active={isActive ? "true" : "false"} aria-current={isActive ? "true" : undefined}>
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
