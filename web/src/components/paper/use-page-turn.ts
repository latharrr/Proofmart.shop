"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Turns a page like a sheet on the desk. `leafRef` is a blank leaf laid over
 * the page (`.pm-leaf`, invisible at rest); when `page` changes, the leaf
 * animates in 3D around the page's left edge. Forward: it lifts off the new
 * page and turns away. Back: it turns in from the left and settles, then
 * vanishes to show the earlier page. Skipped under reduced motion, where the
 * page simply changes.
 */
export function usePageTurn(leafRef: RefObject<HTMLElement | null>, page: number) {
  const prev = useRef(page);

  useEffect(() => {
    const el = leafRef.current;
    const from = prev.current;
    prev.current = page;
    if (!el || from === page || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const forward = page > from;
    const frames: Keyframe[] = forward
      ? [
          { transform: "rotateY(0deg)", opacity: 1, filter: "brightness(1)" },
          { transform: "rotateY(-62deg)", opacity: 1, filter: "brightness(0.93)", offset: 0.55 },
          { transform: "rotateY(-104deg)", opacity: 0 },
        ]
      : [
          { transform: "rotateY(-104deg)", opacity: 0 },
          { transform: "rotateY(-40deg)", opacity: 1, filter: "brightness(0.94)", offset: 0.45 },
          { transform: "rotateY(0deg)", opacity: 1, filter: "brightness(1)", offset: 0.82 },
          { transform: "rotateY(0deg)", opacity: 0 },
        ];

    const anim = el.animate(frames, { duration: forward ? 560 : 600, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
    return () => anim.cancel();
  }, [leafRef, page]);
}
