"use client";

import { useEffect, useState } from "react";

/**
 * /security's sticky "On this page" list. Scroll spy: the last section whose
 * top has passed the line under the header is ticked in red pencil.
 */
export default function SecurityToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = items.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= 160) current = el.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-label="On this page" className="pm-sec-toc">
      <p className="pm-label">On this page</p>
      <ol>
        {items.map((t, i) => (
          <li key={t.id}>
            <a href={`#${t.id}`} data-active={active === t.id ? "true" : "false"} aria-current={active === t.id ? "true" : undefined}>
              <span className="pm-mono pm-sec-toc-n">{String(i + 1).padStart(2, "0")}</span>
              {t.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
