"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode, type RefObject } from "react";

/**
 * Scroll-linked progress — design-system.md §6 "Scroll-linked".
 *
 * `useScrollProgress(ref, { range, onChange })` tracks how far an element has
 * travelled through the viewport as 0→1 WITHOUT re-rendering: it returns a
 * ref whose `.current` is updated once per animation frame while scrolling,
 * and calls `onChange(p)` when it moves. Feed the ref straight to
 * <DocumentStage progress={ref} /> or write CSS variables in `onChange`.
 *
 * Ranges (rect = element, vh = viewport height):
 *   "cover" 0 when the element's top meets the viewport bottom,
 *           1 when its bottom meets the viewport top.            (parallax)
 *   "enter" 0 when its top meets the viewport bottom,
 *           1 when its top reaches 35% of the viewport.          (tilt-to-flat)
 *   "exit"  0 while its top is at/below the viewport top,
 *           1 when its bottom reaches the viewport top.           (hero recede)
 *
 * Under prefers-reduced-motion the value is pinned to `reducedValue`
 * (default: 1 for "enter", 0 otherwise) and never changes.
 */

export type ScrollRange = "cover" | "enter" | "exit";

function measure(el: Element, range: ScrollRange): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  let p: number;
  if (range === "enter") p = (vh - r.top) / (vh * 0.65);
  else if (range === "exit") p = -r.top / Math.max(1, r.height);
  else p = (vh - r.top) / (vh + r.height);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

export function useScrollProgress(
  target: RefObject<Element | null>,
  {
    range = "cover",
    onChange,
    reducedValue,
  }: { range?: ScrollRange; onChange?: (p: number) => void; reducedValue?: number } = {},
): RefObject<number> {
  const progress = useRef(0);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const v = reducedValue ?? (range === "enter" ? 1 : 0);
      progress.current = v;
      cb.current?.(v);
      return;
    }
    let frame = 0;
    let last = -1;
    const update = () => {
      frame = 0;
      const p = measure(el, range);
      progress.current = p;
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        cb.current?.(p);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [target, range, reducedValue]);

  return progress;
}

/**
 * Writes the element's scroll progress to a `--p` CSS variable on itself
 * (0→1, see ranges above), so scroll-linked depth can be pure CSS:
 *
 *   <ScrollVar range="exit" className="pm-scroll-recede"> stage </ScrollVar>
 *   <ScrollVar range="enter" className="pm-scroll-tilt"> media </ScrollVar>
 *   <ScrollVar style={{"--parallax": 120}} className="pm-parallax"> layer </ScrollVar>
 *
 * Children can read var(--p) too. Pass `progressRef` to also receive the ref.
 */
export function ScrollVar({
  children,
  as: Tag = "div",
  range = "cover",
  className,
  style,
  progressRef,
}: {
  children?: ReactNode;
  as?: ElementType;
  range?: ScrollRange;
  className?: string;
  style?: CSSProperties;
  /** Receives the live progress ref (e.g. to drive a DocumentStage inside). */
  progressRef?: (ref: RefObject<number>) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref, {
    range,
    onChange: (v) => ref.current?.style.setProperty("--p", v.toFixed(4)),
  });
  useEffect(() => {
    progressRef?.(p);
  }, [p, progressRef]);
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
