"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** In-page sections of the home page, in scroll order. */
export const SECTION_LINKS = [
  { id: "pipeline", label: "How it works" },
  { id: "markers", label: "Markers" },
  { id: "outputs", label: "Response" },
  { id: "integrate", label: "Integrate" },
  { id: "pricing", label: "Pricing" },
];

/**
 * Primary nav with a scroll spy. Hrefs are root-relative (`/#pipeline`) so the
 * same topbar can render on /security or /login and still get you to the right
 * section; from the home page itself the browser treats them as ordinary
 * same-document fragment links. Off-home the spy finds no sections and leaves
 * every section link inactive.
 *
 * Tracks the last section whose top edge has passed just below the sticky
 * header — rather than "first intersecting" — because several of these
 * sections are tall enough to intersect the viewport at the same time.
 *
 * The active state is carried by colour alone (see `.pm-nav-link`).
 */
export function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = SECTION_LINKS.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // The sticky header is ~68px; anything above this line is "passed".
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

    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return active;
}

export default function NavLinks() {
  const active = useActiveSection();
  const pathname = usePathname();
  const onSecurity = pathname === "/security";

  return (
    <nav aria-label="Primary" className="pm-nav-links">
      {SECTION_LINKS.map((l) => {
        const isActive = active === l.id;
        return (
          <a key={l.id} href={`/#${l.id}`} className="pm-nav-link" data-active={isActive ? "true" : "false"} aria-current={isActive ? "true" : undefined}>
            {l.label}
          </a>
        );
      })}
      <Link href="/security" className="pm-nav-link" data-active={onSecurity ? "true" : "false"} aria-current={onSecurity ? "page" : undefined}>
        Security
      </Link>
    </nav>
  );
}
