"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => {
        const rail = document.getElementById("access");
        // The rail only exists on the home page, and this button now ships in
        // the topbar on every page — so off-home the CTA has to navigate there
        // rather than silently doing nothing.
        if (rail) rail.scrollIntoView({ behavior: "smooth", block: "center" });
        else router.push("/#access");
      }}
    >
      {children}
    </button>
  );
}
