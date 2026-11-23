"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** In-page sections of the home page, in scroll order. */
export const SECTION_LINKS = [
  { id: "product", label: "Product", n: "02" },
  { id: "markers", label: "Markers", n: "04" },
  { id: "integrate", label: "API", n: "06" },
  { id: "pricing", label: "Pricing", n: "07" },
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

/** Desktop primary nav. One --signal underline slides to the current section's link. */
export default function NavLinks() {
  const active = useActiveSection();
  const pathname = usePathname();
  const onSecurity = pathname === "/security";
  const nav = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[data-active="true"]');
    const b = bar.current;
    if (!b) return;
    if (!el) {
      b.style.opacity = "0";
      return;
    }
    b.style.opacity = "1";
    b.style.transform = `translateX(${el.offsetLeft}px) scaleX(${el.offsetWidth})`;
  }, [active, onSecurity]);

  return (
    <nav aria-label="Primary" className="pm-mk-nav" ref={nav}>
      <span ref={bar} className="pm-mk-nav-bar" aria-hidden="true" />
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
