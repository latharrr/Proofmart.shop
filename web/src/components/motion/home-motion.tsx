"use client";

import { useEffect } from "react";

/**
 * Loads the home page's scroll layer (home-scroll.ts: GSAP, ScrollTrigger,
 * Lenis) after first paint, so none of it is in the critical path. Skipped
 * under reduced motion; torn down on route change (unmount).
 */
export default function HomeMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    const go = () =>
      import("./home-scroll").then(({ startHomeScroll }) => {
        if (!cancelled) stop = startHomeScroll();
      });
    const hasIdle = typeof window.requestIdleCallback === "function";
    const handle = hasIdle ? window.requestIdleCallback(go, { timeout: 1200 }) : window.setTimeout(go, 300);
    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      stop?.();
    };
  }, []);
  return null;
}
