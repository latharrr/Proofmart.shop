"use client";

import { useEffect, useRef } from "react";
import { createDocumentScene, type SceneTone, type SceneVariant, type SceneVerdict } from "./scene-core";

/**
 * The real-time scene (three.js). Client-only and heavy — don't import this
 * directly from a page; use <DocumentStage> (document-stage.tsx), which loads
 * it lazily with next/dynamic({ ssr: false }) over a matching poster frame.
 */

export type ProgressInput = number | { readonly current: number | null };

export type DocumentSceneProps = {
  variant?: SceneVariant;
  tone?: SceneTone;
  verdict?: SceneVerdict;
  /** 0→1. A number, or a ref (e.g. from useScrollProgress) read every frame. */
  progress?: ProgressInput;
  /** Cursor parallax (fine pointers only; always off under reduced motion). */
  interactive?: boolean;
  /** Draw the volt ribbon (hero and stack only). */
  ribbon?: boolean;
  /** Progress of the single static pose rendered under reduced motion. */
  restProgress?: number;
  onReady?: () => void;
  onLost?: () => void;
};

function read(p: ProgressInput | undefined): number {
  if (p === undefined) return 0;
  if (typeof p === "number") return p;
  return p.current ?? 0;
}

export default function DocumentScene({
  variant = "hero",
  tone = "graphite",
  verdict = "FAIL",
  progress,
  interactive = true,
  ribbon = true,
  restProgress = 0,
  onReady,
  onLost,
}: DocumentSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef({ progress, onReady, onLost });
  useEffect(() => {
    live.current = { progress, onReady, onLost };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ctl = createDocumentScene(host, {
      variant,
      tone,
      verdict,
      interactive,
      ribbon,
      restProgress,
      getProgress: () => read(live.current.progress),
      onReady: () => live.current.onReady?.(),
      onLost: () => live.current.onLost?.(),
    });
    return () => ctl.dispose();
  }, [variant, tone, verdict, interactive, ribbon, restProgress]);

  return <div ref={hostRef} className="pm-scene-gl" />;
}
