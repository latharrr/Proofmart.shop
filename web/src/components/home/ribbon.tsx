"use client";

import { useId, useRef } from "react";
import { useScrollProgress } from "@/components/motion/scroll-progress";

/**
 * A volt ribbon that sweeps behind a section heading and draws itself on as
 * the section scrolls through (bar.md §2: "a 3D ribbon or path"). A tube
 * read: a volt→volt-2 body, a soft shadow beneath and a highlight along its
 * top edge. Decorative; static and fully drawn under reduced motion.
 */
export default function Ribbon({ d, className, width = 30 }: { d: string; className?: string; width?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  useScrollProgress(ref, {
    range: "cover",
    reducedValue: 1,
    onChange: (p) => {
      const t = Math.min(1, Math.max(0, (p - 0.08) / 0.5));
      const e = 1 - Math.pow(1 - t, 3);
      ref.current?.style.setProperty("--draw", e.toFixed(4));
    },
  });
  return (
    <svg ref={ref} className={className ? `pm-mk-ribbon ${className}` : "pm-mk-ribbon"} viewBox="0 0 1440 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#3b49f4" />
          <stop offset="0.55" stopColor="#4a63fb" />
          <stop offset="1" stopColor="#5981fe" />
        </linearGradient>
        <filter id={`rs-${id}`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <path d={d} pathLength={1} className="pm-mk-ribbon-shadow" strokeWidth={width} filter={`url(#rs-${id})`} transform="translate(0 22)" />
      <path d={d} pathLength={1} className="pm-mk-ribbon-body" stroke={`url(#rg-${id})`} strokeWidth={width} />
      <path d={d} pathLength={1} className="pm-mk-ribbon-sheen" strokeWidth={width * 0.18} transform={`translate(0 ${-width * 0.24})`} />
    </svg>
  );
}
