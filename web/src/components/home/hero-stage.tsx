"use client";

import { useRef, type ReactNode } from "react";
import Frame from "@/components/motion/frame";
import { useScrollProgress } from "@/components/motion/scroll-progress";
import DocumentStage from "@/components/three/document-stage";

/**
 * The hero's framed 3D stage. One scroll value drives three depth layers as
 * the hero leaves the screen: the stage recedes (scale), the copy rises
 * faster than the page, and the scene itself fans its pages and draws its
 * ribbon (DocumentStage `progress`). Under reduced motion the value is
 * pinned at 0 and the CSS ignores it.
 */
export default function HeroStage({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(ref, {
    range: "exit",
    onChange: (p) => ref.current?.style.setProperty("--p", p.toFixed(4)),
  });

  return (
    <div ref={ref} className="pm-mk-hero-depth">
      <Frame columns={4} tone="graphite" label="Scroll to explore" className="pm-mk-hero-frame" stageClassName="pm-mk-hero-stage">
        <div className="pm-mk-hero-scene">
          <DocumentStage
            variant="stack"
            tone="graphite"
            progress={progress}
            preload
            label="A bank statement under examination: page 4's row 17 is boxed in red and tagged FAIL, its balance off by ₹5,000.00."
          />
        </div>
        <div className="pm-mk-hero-copy">{children}</div>
        {overlay}
      </Frame>
    </div>
  );
}
