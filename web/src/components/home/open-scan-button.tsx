"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { SCAN_INTENT_EVENT } from "@/components/evidence-rail/scan-intent";

/**
 * Starts a scan: scrolls the Evidence Rail into view and tells it to show its
 * drop zone, whose "Choose a PDF" button takes focus. On a wide screen the
 * rail is already on screen, so scrolling alone did nothing visible; the drop
 * zone is the visible step. Deliberately does NOT open the native file picker
 * itself — springing the OS dialog from a marketing button skips the rail's
 * own drag / paste / choose affordances (tests/e2e/scan-cta.spec.ts holds
 * this). One click on "Choose a PDF" gets there.
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
        // The rail only exists on the home page; anywhere else, go there.
        if (!rail) {
          router.push("/#access");
          return;
        }
        rail.scrollIntoView({ behavior: "smooth", block: "center" });
        window.dispatchEvent(new Event(SCAN_INTENT_EVENT));
      }}
    >
      {children}
    </button>
  );
}
