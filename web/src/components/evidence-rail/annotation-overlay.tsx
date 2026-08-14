"use client";

import { useLayoutEffect, useRef } from "react";

export interface AnnotationOverlayProps {
  rect: { x: number; y: number; w: number; h: number };
  color: string;
  fill: string;
  /** Same units as `rect` — the sample uses a fixed 640x800 mock page; real documents pass the page's actual PDF-point dimensions from pdf.js. */
  viewBoxWidth: number;
  viewBoxHeight: number;
  /** Bump to re-trigger the draw-in animation even if the rect itself is unchanged (e.g. re-selecting the same finding). */
  animationKey: string;
}

export default function AnnotationOverlay({ rect, color, fill, viewBoxWidth, viewBoxHeight, animationKey }: AnnotationOverlayProps) {
  const strokeRef = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    const el = strokeRef.current;
    if (!el) return;
    const { w, h } = rect;
    const p = 2 * (w + h);
    el.style.transition = "none";
    el.style.strokeDashoffset = String(p);
    // Force reflow so the transition below animates from the reset offset.
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 180ms cubic-bezier(0.2,0,0,1)";
    el.style.strokeDashoffset = "0";
  }, [animationKey, rect]);

  const { x, y, w, h } = rect;
  const p = 2 * (w + h);
  const T = 6;
  const corners = [
    `M ${x - T} ${y} L ${x} ${y} L ${x} ${y - T}`,
    `M ${x + w + T} ${y} L ${x + w} ${y} L ${x + w} ${y - T}`,
    `M ${x - T} ${y + h} L ${x} ${y + h} L ${x} ${y + h + T}`,
    `M ${x + w + T} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h + T}`,
  ];

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
    >
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke="none" />
      <rect ref={strokeRef} x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={1} strokeDasharray={p} strokeDashoffset={p} />
      {corners.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="square" />
      ))}
    </svg>
  );
}
