"use client";

import { useRef, type ReactNode } from "react";
import Frame from "@/components/motion/frame";
import { useScrollProgress } from "@/components/motion/scroll-progress";
import DocumentStage from "@/components/three/document-stage";
import type { SceneVerdict } from "@/components/three/scene-core";

/**
 * A framed 3D stage whose scene follows the page's scroll: as the frame
 * passes through the viewport its pages fan out and the ribbon draws on,
 * and the frame itself scales up from slightly receded (`--p` 0→1).
 */
export default function DepthStage({
  variant = "hero",
  verdict = "FAIL",
  columns = 4,
  label,
  sceneLabel,
  className,
  children,
}: {
  variant?: "hero" | "stack" | "single";
  verdict?: SceneVerdict;
  columns?: number;
  label?: ReactNode;
  sceneLabel?: string;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(ref, {
    range: "cover",
    reducedValue: 0.5,
    onChange: (p) => ref.current?.style.setProperty("--p", p.toFixed(4)),
  });
  return (
    <div ref={ref} className={className ? `pm-mk-depth ${className}` : "pm-mk-depth"}>
      <Frame columns={columns} tone="graphite" label={label} stageClassName="pm-mk-depth-stage">
        <div className="pm-mk-depth-scene">
          <DocumentStage variant={variant} tone="graphite" verdict={verdict} progress={progress} restProgress={0.5} label={sceneLabel} />
        </div>
        {children}
      </Frame>
    </div>
  );
}
