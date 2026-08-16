"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Scrolls the Evidence Rail into view rather than linking to an anchor. The
 * rail sits beside this button in the hero on desktop, so scrolling to it is
 * a no-op there — a CTA literally called "start a scan" needs to visibly do
 * something regardless of viewport. Deliberately does NOT auto-open the
 * native file picker: popping the OS file dialog the instant someone clicks
 * a nav button is jarring and skips past the rail's own drop-zone UI
 * (drag/paste/click hints). Landing on the rail and letting the user choose
 * how to add a file is the minimal, calmer version of this CTA.
 */
export default function OpenScanButton({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => {
        document.getElementById("access")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      {children}
    </button>
  );
}
