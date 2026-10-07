"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * The site's one enter gesture: 10px of rise plus a fade, 500ms ease-out,
 * staggered by `delay` (300ms per sibling). Transform/opacity only.
 *
 * Three states, carried on `data-reveal`:
 * - `pending` — server render and anything waiting to enter: opacity 0.
 * - `shown`   — has entered; transitions to rest.
 * - `parked`  — below the fold on a page nobody has scrolled yet: painted at
 *   rest with no transition.
 *
 * Why `parked` exists: the gesture is for a reader who scrolls into a
 * section. A visitor who never scrolls (a print, a reader view, a full-page
 * capture, a link preview) would otherwise get a document that is blank below
 * the first screen, because the observer that reveals it never fires. So
 * below-fold content stays painted until the first real scroll, and only then
 * is it set back to `pending` — off-screen, invisibly — to enter as it arrives.
 *
 * Degradation, because `pending` is invisible:
 * - No IntersectionObserver: shown on the next frame.
 * - No JavaScript: the `<noscript>` rule in layout.tsx wins.
 * - prefers-reduced-motion: the CSS drops the gesture; everything paints at rest.
 * - First screen, observer never fires: the watchdog shows it anyway.
 */

/** Watchdog delay: past the hero's own 900ms stagger, before a reader reacts. */
const REVEAL_DEADLINE_MS = 1500;

type RevealState = "pending" | "shown" | "parked";

export default function Reveal({
  children,
  delay = 0,
  className,
  style,
  id,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Stagger offset in ms — the system's stagger is 300ms, so pass `i * 300`. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  /** Anchor target, when the revealed element is also a scroll destination. */
  id?: string;
  /** Element to render as — a reveal inside an `<ol>`/`<ul>` must still be an `<li>`. */
  as?: "div" | "li" | "article" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
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
      // The positive bottom margin starts the gesture a quarter-viewport
      // early, so it has settled by the time it is actually looked at.
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setState("shown");
              observer?.disconnect();
            }
          }
        },
        { rootMargin: "0px 0px 25% 0px", threshold: 0.01 },
      );
      observer.observe(el);
    };

    const rect = el.getBoundingClientRect();
    const inFirstScreen = rect.top < window.innerHeight && rect.bottom > 0;

    if (inFirstScreen) {
      watch();
      watchdog = window.setTimeout(() => {
        setState("shown");
        observer?.disconnect();
      }, REVEAL_DEADLINE_MS);
      return () => {
        window.clearTimeout(watchdog);
        observer?.disconnect();
      };
    }

    // Below the fold: paint at rest until the reader scrolls.
    frame = requestAnimationFrame(() => setState("parked"));
    const onFirstScroll = () => {
      window.removeEventListener("scroll", onFirstScroll);
      const r = el.getBoundingClientRect();
      // Still comfortably out of sight: re-arm it to enter. Anything the
      // scroll has already brought close stays painted — it must not blink.
      if (r.top > window.innerHeight * 1.25 || r.bottom < 0) {
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
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLLIElement>}
      id={id}
      className={className ? `pm-reveal ${className}` : "pm-reveal"}
      data-reveal={state}
      style={{ ...style, ...({ "--pm-delay": `${delay}ms` } as CSSProperties) }}
    >
      {children}
    </Tag>
  );
}
