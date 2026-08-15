"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Opens the Evidence Rail's real file picker directly, by id, rather than
 * linking to an anchor. The rail sits beside this button in the hero on
 * desktop, so scrolling to it is a no-op there — a CTA literally called
 * "start a scan" needs to visibly do something regardless of viewport.
 * Scrolls #access (the rail's wrapper) into view first so the
 * uploading/ready state is on screen once the native file dialog closes.
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
        (document.getElementById("pm-file-input") as HTMLInputElement | null)?.click();
      }}
    >
      {children}
    </button>
  );
}
