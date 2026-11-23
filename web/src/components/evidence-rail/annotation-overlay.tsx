"use client";

import { useLayoutEffect, useRef } from "react";

export interface AnnotationOverlayProps {
  rect: { x: number; y: number; w: number; h: number };
  color: string;
  /** The verdict wash behind the box; "none" for a hover preview. */
  fill: string;
  /** Same units as `rect`: the sample uses a fixed 640x800 mock page; real documents pass the page's actual PDF-point dimensions from pdf.js. */
  viewBoxWidth: number;
  viewBoxHeight: number;
  /** Bump to re-trigger the draw-in even if the rect itself is unchanged (e.g. re-selecting the same finding). */
  animationKey: string;
  /** Hover preview: a dashed, pulsing outline rather than the pinned box. */
  preview?: boolean;
}

/**
 * A finding's box on the page, exactly on its PDF coordinates (tests/e2e
 * measure the first `rect`): the stroke draws round it in one pass (400ms),
 * then the verdict wash fades in behind. Under reduced motion both are
 * simply there.
 */
export default function AnnotationOverlay({ rect, color, fill, viewBoxWidth, viewBoxHeight, animationKey, preview = false }: AnnotationOverlayProps) {
  const strokeRef = useRef<SVGRectElement>(null);
  const washRef = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    const el = strokeRef.current;
    const wash = washRef.current;
    if (!el || preview) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 400, easing: "cubic-bezier(0.2, 0, 0, 1)" });
    wash?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: 640, easing: "ease-out" });
  }, [animationKey, rect, preview]);

  const { x, y, w, h } = rect;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={preview ? "pm-box pm-box-preview" : "pm-box"}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
    >
      {preview ? null : <rect ref={washRef} x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke="none" />}
      <rect
        ref={strokeRef}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill="none"
        stroke={color}
        strokeWidth={preview ? 1.5 : 2}
        strokeDasharray={preview ? "4 3" : 1}
        pathLength={preview ? undefined : 1}
        strokeDashoffset={0}
      />
    </svg>
  );
}
