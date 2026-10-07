"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { DocumentSceneProps } from "./document-scene";

/**
 * <DocumentStage> — the 3D document scene with its poster frame.
 *
 * Fills its parent (width/height 100%): give the parent a size, e.g. put it
 * inside <Frame aspect="16 / 8"> or a box with an explicit height. The poster
 * (a still render of the same scene, /public/scene/<variant>-<tone>.webp) is
 * server-rendered and painted first; three.js is fetched lazily once the stage
 * is near the viewport, and its canvas fades in over the poster after its
 * first frame. Same box throughout, so no layout shift. If WebGL is missing or
 * the context is lost, the poster simply stays.
 */

const LABELS = {
  FAIL: "A bank statement under examination: a flagged row is boxed in red and marked FAIL.",
  REVIEW: "A bank statement under examination: a row is boxed and marked REVIEW.",
  CLEAR: "A bank statement under examination, marked CLEAR.",
} as const;

const DocumentScene = dynamic(() => import("./document-scene"), { ssr: false });

export type DocumentStageProps = DocumentSceneProps & {
  className?: string;
  style?: CSSProperties;
  /** Accessible description of the scene. */
  label?: string;
  /** Load the poster eagerly (use for the above-the-fold hero). */
  preload?: boolean;
  /** Override the poster image path, or `false` for no poster. */
  poster?: string | false;
};

export default function DocumentStage({
  className,
  style,
  label,
  preload = false,
  poster,
  variant = "hero",
  tone = "graphite",
  onReady,
  onLost,
  ...sceneProps
}: DocumentStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  // Only fetch three.js / create a GL context when the stage is close to view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const verdict = sceneProps.verdict ?? "FAIL";
  const src =
    poster === false
      ? null
      : (poster ?? `/scene/${variant}-${tone}${verdict === "FAIL" ? "" : `-${verdict.toLowerCase()}`}.webp`);

  return (
    <div
      ref={ref}
      className={className ? `pm-scene ${className}` : "pm-scene"}
      style={style}
      data-ready={ready ? "" : undefined}
      data-variant={variant}
      data-tone={tone}
      role="img"
      aria-label={label ?? LABELS[sceneProps.verdict ?? "FAIL"]}
    >
      {src ? (
        <Image
          className="pm-scene-poster"
          src={src}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 1296px"
          preload={preload}
          loading={preload ? "eager" : "lazy"}
        />
      ) : null}
      {near ? (
        <DocumentScene
          {...sceneProps}
          variant={variant}
          tone={tone}
          onReady={() => {
            setReady(true);
            onReady?.();
          }}
          onLost={() => {
            setReady(false);
            onLost?.();
          }}
        />
      ) : null}
    </div>
  );
}
