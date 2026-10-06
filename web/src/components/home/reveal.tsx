"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Reveals its children once, when they first scroll into view — a small
 * translate plus a fade, staggered by `delay` when several siblings enter
 * together. Transform/opacity only, so the animation never leaves the
 * compositor and never reflows the page.
 *
 * Degradation matters here because the reveal's resting state is invisible:
 * - No IntersectionObserver (or an observer that never fires): shown immediately.
 * - No JavaScript at all: the `<noscript>` rule in layout.tsx wins.
 * - prefers-reduced-motion: the CSS drops the animation entirely, so the
 *   element is visible from first paint regardless of what this does.
 * - Never scrolled at all: the watchdog below, which covers the first screen
 *   only. An observer that somehow never fires would otherwise leave the
 *   opening screen blank, which is the one failure a visitor always sees.
 *   Below the fold the observer stays authoritative — a timer that revealed
 *   the whole document would fire every gesture off-screen for anyone who
 *   pauses before scrolling, which is most people.
 */

/** Watchdog delay: past the hero's own 900ms stagger, before a reader reacts. */
const REVEAL_DEADLINE_MS = 1500;

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
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Deferred rather than set inline: a synchronous setState in an effect
      // body cascades an extra render pass, and the initial state can't be
      // seeded from IntersectionObserver either — it's absent during SSR too,
      // which would make every element mismatch on hydration.
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    // Already in view on mount (above the fold) — show without waiting for a
    // scroll event that may never come. The positive bottom margin starts the
    // gesture a quarter-viewport early, so the element has settled by the time
    // it is actually looked at rather than animating under the reader's eye.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px 25% 0px", threshold: 0.01 },
    );

    observer.observe(el);

    // Scoped to the first screen only. An element already in the viewport at
    // mount must become visible whether or not the observer ever fires, so a
    // page nobody scrolls still renders its opening screen. Everything below
    // the fold keeps waiting for the observer — extending this to the whole
    // document would fire every reveal off-screen on a timer and destroy the
    // gesture for anyone who pauses before scrolling.
    const inFirstScreen = el.getBoundingClientRect().top < window.innerHeight;
    const watchdog = inFirstScreen
      ? window.setTimeout(() => {
          setShown(true);
          observer.disconnect();
        }, REVEAL_DEADLINE_MS)
      : undefined;

    return () => {
      if (watchdog !== undefined) window.clearTimeout(watchdog);
      observer.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLLIElement>}
      id={id}
      className={className ? `pm-reveal ${className}` : "pm-reveal"}
      data-shown={shown ? "true" : "false"}
      style={{ ...style, ...({ "--pm-delay": `${delay}ms` } as CSSProperties) }}
    >
      {children}
    </Tag>
  );
}
