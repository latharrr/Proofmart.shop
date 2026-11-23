"use client";

import type { ReactNode } from "react";
import RollPill from "@/components/motion/roll-pill";
import { scrollToEl } from "@/components/motion/scroll-to";
import { RUN_SAMPLE_EVENT } from "@/components/evidence-rail/scan-intent";

/**
 * "Run the sample": brings the Evidence Rail into view on its bundled
 * SAMPLE, pins the first finding and focuses it, so the next keypress is
 * already inside the findings index. Off the home page it goes there.
 */
export default function RunSampleButton({ children, variant = "primary", className }: { children: ReactNode; variant?: "primary" | "secondary" | "paper"; className?: string }) {
  return (
    <RollPill
      variant={variant}
      dot
      className={className}
      onClick={() => {
        const rail = document.querySelector('[data-testid="evidence-rail"]');
        if (!rail) {
          window.location.assign("/#product");
          return;
        }
        scrollToEl(rail, "start");
        window.dispatchEvent(new Event(RUN_SAMPLE_EVENT));
      }}
    >
      {children}
    </RollPill>
  );
}
