"use client";

import { useLayoutEffect, useRef } from "react";

export interface AnnotationOverlayProps {
  rect: { x: number; y: number; w: number; h: number };
  color: string;
  fill: string;
  /** Same units as `rect`: the sample uses a fixed 640x800 mock page; real documents pass the page's actual PDF-point dimensions from pdf.js. */
  viewBoxWidth: number;
  viewBoxHeight: number;
  /** Bump to re-trigger the draw-in animation even if the rect itself is unchanged (e.g. re-selecting the same finding). */
  animationKey: string;
}

/**
 * The pinned finding, ringed in pencil: a wash over the region, then a
 * rounded ring drawn round it in one stroke, the way a reviewer circles a
 * figure on a printout. The ring is a `<rect>` with full-height corner
 * radius so it stays exactly on the PDF coordinates (tests/e2e measure it).
 * Under reduced motion it appears already drawn.
 */
export default function AnnotationOverlay({ rect, color, fill, viewBoxWidth, viewBoxHeight, animationKey }: AnnotationOverlayProps) {
  const strokeRef = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    const el = strokeRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transition = "none";
      el.style.strokeDashoffset = "0";
      return;
    }
    el.style.transition = "none";
    el.style.strokeDashoffset = "1";
    // Force reflow so the transition below animates from the reset offset.
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 520ms cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.strokeDashoffset = "0";
  }, [animationKey, rect]);

  const { x, y, w, h } = rect;
  const r = Math.min(h / 2, w / 2);

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
    >
      <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke="none" />
      <rect
        ref={strokeRef}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={0}
      />
    </svg>
  );
}
