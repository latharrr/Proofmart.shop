"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** In-page sections of the home page, in scroll order. */
export const SECTION_LINKS = [
  { id: "pipeline", label: "How it works", wp: "B" },
  { id: "markers", label: "Markers", wp: "C" },
  { id: "outputs", label: "Response", wp: "D" },
  { id: "integrate", label: "Integrate", wp: "E" },
  { id: "pricing", label: "Pricing", wp: "F" },
];

/**
 * Scroll spy: the last home section whose top has passed just below the
 * sticky header. Hrefs are root-relative (`/#pipeline`) so the same topbar
 * works on /security; off-home there are no sections and nothing is active.
 */
export function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = SECTION_LINKS.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = 120;
      let current: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
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

/** Desktop primary nav. The active link is underlined in red pencil. */
export default function NavLinks() {
  const active = useActiveSection();
  const pathname = usePathname();
  const onSecurity = pathname === "/security";

  return (
    <nav aria-label="Primary" className="pm-mk-nav">
      {SECTION_LINKS.map((l) => {
        const isActive = active === l.id;
        return (
          <a key={l.id} href={`/#${l.id}`} className="pm-mk-nav-link" data-active={isActive ? "true" : "false"} aria-current={isActive ? "true" : undefined}>
            {l.label}
          </a>
        );
      })}
      <Link href="/security" className="pm-mk-nav-link" data-active={onSecurity ? "true" : "false"} aria-current={onSecurity ? "page" : undefined}>
        Security
      </Link>
    </nav>
  );
}
