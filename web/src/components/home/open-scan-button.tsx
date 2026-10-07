"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import RollPill from "@/components/motion/roll-pill";
import { SCAN_INTENT_EVENT } from "@/components/evidence-rail/scan-intent";

/**
 * Starts a scan: scrolls the Evidence Rail into view and tells it to show its
 * drop zone, whose "Choose a PDF" button takes focus — the visible step.
 * Deliberately does NOT open the native file picker itself: springing the OS
 * dialog from a marketing button skips the rail's own drag / paste / choose
 * affordances (tests/e2e/scan-cta.spec.ts holds this). Off the home page it
 * goes to SCAN_URL's anchor.
 */
export default function OpenScanButton({
  children,
  className,
  variant = "primary",
  dot = true,
  size = "md",
  onDone,
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "paper";
  dot?: boolean;
  size?: "md" | "sm";
  /** Called after the intent fires (e.g. to close the phone menu). */
  onDone?: () => void;
}) {
  const router = useRouter();

  return (
    <RollPill
      variant={variant}
      dot={dot}
      size={size}
      className={className}
      onClick={() => {
        onDone?.();
        // Look for the rail itself: /security also has an #access section.
        const found = document.querySelector('[data-testid="evidence-rail"]');
        const rail = found ? (found.closest("#access") ?? found) : null;
        // The rail only exists on the home page; anywhere else, go there armed.
        if (!rail) {
          router.push("/?scan=1#access");
          return;
        }
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        rail.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        window.dispatchEvent(new Event(SCAN_INTENT_EVENT));
      }}
    >
      {children}
    </RollPill>
  );
}
