"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Perspective tilt toward the pointer — design-system.md §4 (perspective
 * 1200px, at most 8° on any axis). Damped: the card eases toward the target
 * every frame (no snapping, no overshoot) and eases back to flat on leave.
 * Off for coarse pointers and prefers-reduced-motion. The rAF loop only runs
 * while the pose is moving.
 */
export default function Tilt({
  children,
  max = 8,
  damping = 9,
  as: Tag = "div",
  className,
  style,
  innerClassName,
  innerStyle,
}: {
  children: ReactNode;
  /** Max rotation in degrees (clamped to 8). */
  max?: number;
  /** Higher = snappier. ~9 settles in roughly 400ms. */
  damping?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  innerClassName?: string;
  innerStyle?: CSSProperties;
}) {
  const outer = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outer.current;
    const card = inner.current;
    if (!el || !card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const limit = Math.min(8, Math.max(0, max));
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-damping * dt);
      x += (tx - x) * k;
      y += (ty - y) * k;
      card.style.transform = `rotateX(${y.toFixed(3)}deg) rotateY(${x.toFixed(3)}deg)`;
      if (Math.abs(tx - x) > 0.01 || Math.abs(ty - y) > 0.01) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        last = 0;
      }
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      tx = Math.max(-1, Math.min(1, nx)) * limit;
      ty = -Math.max(-1, Math.min(1, ny)) * limit;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      card.style.transform = "";
    };
  }, [max, damping]);

  return (
    <Tag ref={outer} className={className ? `pm-tilt ${className}` : "pm-tilt"} style={style}>
      <div ref={inner} className={innerClassName ? `pm-tilt-inner ${innerClassName}` : "pm-tilt-inner"} style={innerStyle}>
        {children}
      </div>
    </Tag>
  );
}
