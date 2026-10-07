"use client";

import { useRef, type ReactNode } from "react";
import Frame from "@/components/motion/frame";
import { useScrollProgress } from "@/components/motion/scroll-progress";
import DocumentStage from "@/components/three/document-stage";

/**
 * "What you get back": the examined page in 3D with the response beside it.
 * Layered parallax — the JSON card travels faster than the stage and the
 * scene slower — while the scene's own progress settles the page flat.
 */
export default function OutputsStage({ json }: { json: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(ref, {
    range: "cover",
    reducedValue: 0.5,
    onChange: (p) => ref.current?.style.setProperty("--p", p.toFixed(4)),
  });
  return (
    <div ref={ref} className="pm-mk-outputs-depth">
      <Frame columns={3} tone="graphite" className="pm-mk-outputs-frame" stageClassName="pm-mk-outputs-stage" label="Same finding, as data">
        <div className="pm-mk-outputs-scene">
          <DocumentStage
            variant="single"
            tone="graphite"
            progress={progress}
            restProgress={0.5}
            label="The examined statement page, its broken row boxed and tagged FAIL — the finding the JSON beside it describes."
          />
        </div>
        <div className="pm-mk-outputs-json">{json}</div>
      </Frame>
    </div>
  );
}
