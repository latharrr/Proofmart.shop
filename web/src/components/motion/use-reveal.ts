"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared trigger for <Reveal> and <LineReveal>. Three states, carried on
 * `data-reveal`:
 *
 * - `pending` — server render and anything waiting to enter (hidden by CSS).
 * - `shown`   — has entered; the CSS transition runs to rest.
 * - `parked`  — below the fold on a page nobody has scrolled yet: painted at
 *   rest with no transition, so a full-page capture, print or reader view
 *   is never blank below the first screen. On the first real scroll, parked
 *   elements still far off-screen are re-armed to `pending` (invisibly) and
 *   enter as they arrive.
 *
 * Degradation: no IntersectionObserver → shown next frame; no JS → the
 * <noscript> rule in layout.tsx; reduced motion → CSS paints everything at
 * rest; first screen and the observer never fires → a watchdog shows it.
 */

export type RevealState = "pending" | "shown" | "parked";

/** Past a first-screen stagger, before a reader reacts. */
const WATCHDOG_MS = 1600;

export function useReveal<T extends HTMLElement>({ once = true }: { once?: boolean } = {}) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>("pending");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let observer: IntersectionObserver | undefined;
    let watchdog: number | undefined;
    let frame = 0;

    if (typeof IntersectionObserver === "undefined") {
      frame = requestAnimationFrame(() => setState("shown"));
      return () => cancelAnimationFrame(frame);
    }

    const watch = () => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setState("shown");
              if (once) observer?.disconnect();
            } else if (!once && entry.boundingClientRect.top > 0) {
              setState("pending");
            }
          }
        },
        // Start a touch before the element is fully in, so it has mostly
        // settled by the time it is looked at.
        { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
      );
      observer.observe(el);
    };

    const rect = el.getBoundingClientRect();
    const inFirstScreen = rect.top < window.innerHeight && rect.bottom > 0;

    if (inFirstScreen || window.scrollY > 0) {
      watch();
      if (inFirstScreen) {
        watchdog = window.setTimeout(() => {
          setState((s) => (s === "pending" ? "shown" : s));
        }, WATCHDOG_MS);
      }
      return () => {
        window.clearTimeout(watchdog);
        observer?.disconnect();
      };
    }

    frame = requestAnimationFrame(() => setState("parked"));
    const onFirstScroll = () => {
      window.removeEventListener("scroll", onFirstScroll);
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 1.1 || r.bottom < 0) {
        setState("pending");
        watch();
      }
    };
    window.addEventListener("scroll", onFirstScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onFirstScroll);
      observer?.disconnect();
    };
  }, [once]);

  return [ref, state] as const;
}

/** True when the visitor asked for reduced motion. SSR-safe (false on server). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
