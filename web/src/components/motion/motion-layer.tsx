"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";

/** Scrambles an element's text nodes and resolves them left to right in `ms`. Height is locked meanwhile so a rewrap can't push the page. */
function decode(el: HTMLElement, ms = 500) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; text: string }[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue?.trim()) nodes.push({ node: n as Text, text: n.nodeValue });
  const total = nodes.reduce((s, x) => s + x.text.length, 0);
  if (total === 0) return;
  el.style.minHeight = `${el.offsetHeight}px`;
  const start = performance.now();
  const frame = (now: number) => {
    const done = Math.min(1, (now - start) / ms);
    let seen = 0;
    for (const { node, text } of nodes) {
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const resolved = (seen + i) / total < done;
        out += resolved || text[i] === " " ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.nodeValue = out;
      seen += text.length;
    }
    if (done < 1) requestAnimationFrame(frame);
    else {
      for (const { node, text } of nodes) node.nodeValue = text;
      el.style.minHeight = "";
    }
  };
  requestAnimationFrame(frame);
}

/** Scrambles an element's own text (no children) to its value in `ms`. */
function scrambleText(el: HTMLElement, ms: number) {
  const node = el.firstChild;
  if (!(node instanceof Text)) return;
  const text = node.nodeValue ?? "";
  const start = performance.now();
  const frame = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    node.nodeValue = [...text].map((c, i) => (i / text.length < p || !/[0-9A-Z]/.test(c) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    if (p < 1) requestAnimationFrame(frame);
    else node.nodeValue = text;
  };
  requestAnimationFrame(frame);
}

/** Page 1 of a saved document, rendered once per document for the row preview (lazy: pdf.js loads on first hover). */
const docThumbs = new Map<string, Promise<HTMLCanvasElement | null>>();
function docThumb(id: string): Promise<HTMLCanvasElement | null> {
  if (!docThumbs.has(id)) {
    docThumbs.set(
      id,
      (async () => {
        try {
          const res = await fetch(`/api/documents/${id}/file`);
          if (!res.ok) return null;
          const { loadPdfDocument, renderPageToCanvas } = await import("@/lib/pdf/render");
          const pdf = await loadPdfDocument(await res.arrayBuffer());
          const canvas = document.createElement("canvas");
          await renderPageToCanvas(pdf, 1, canvas, 150);
          return canvas;
        } catch {
          return null;
        }
      })(),
    );
  }
  return docThumbs.get(id)!;
}

/**
 * The site's light motion script (DESIGN.md, Motion). Everything it touches
 * is visible without it: the hidden starting states only apply under
 * `html[data-motion]`, which the root layout sets before paint unless the
 * visitor prefers reduced motion. The home page's scroll-driven layer is
 * separate (home-scroll.ts).
 *
 *   [data-reveal]   y 16→0 + fade, once, when its top crosses 85% of the viewport
 *   [data-leader]   the index row's hairline draws, its leader fills, its [nn] scrambles
 *   [data-decode]   heading glyphs scramble and resolve (500ms, once) as it rises
 *   [data-cursor]   an "Inspect ↗" or "Copy" label rides beside the (always visible) system cursor
 *   [data-preview]  a page thumbnail trails the pointer ("sample:N" or "doc:<id>")
 *
 * Also: the marketing header's scrolled state, hide-on-scroll-down and its
 * 1px scroll-progress bar.
 */
export default function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!("motion" in root.dataset)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          el.dataset.in = "";
          if ("decode" in el.dataset) decode(el);
          if ("leader" in el.dataset) {
            const n = el.querySelector<HTMLElement>(".pm-index-n");
            if (n) scrambleText(n, 400);
          }
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in]), [data-leader]:not([data-in]), [data-decode]:not([data-in])").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  // Header: scrolled state always; hide on the way down only with motion.
  useEffect(() => {
    const top = document.querySelector<HTMLElement>(".pm-mk-top");
    if (!top) return;
    const bar = top.querySelector<HTMLElement>(".pm-mk-progress");
    const motion = "motion" in document.documentElement.dataset;
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      top.toggleAttribute("data-scrolled", y > 8);
      const menuOpen = "menuOpen" in document.documentElement.dataset;
      if (motion && !menuOpen && Math.abs(y - lastY) > 4) top.toggleAttribute("data-hidden", y > lastY && y > 240);
      if (menuOpen) top.removeAttribute("data-hidden");
      lastY = y;
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Keyboard users reaching the header bring it back.
    const onFocus = () => top.removeAttribute("data-hidden");
    top.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      top.removeEventListener("focusin", onFocus);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (!("motion" in root.dataset) || !window.matchMedia("(pointer: fine)").matches) return;

    const cur = document.createElement("div");
    cur.className = "pm-cursor";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<span class="pm-cursor-dot"></span><span class="pm-cursor-pill"></span>';
    const pill = cur.querySelector<HTMLElement>(".pm-cursor-pill")!;
    const preview = document.createElement("div");
    preview.className = "pm-cursor-preview";
    preview.setAttribute("aria-hidden", "true");
    document.body.append(cur, preview);

    // Target (pointer) and lerped positions; the label eases 18% of the way each frame.
    let tx = -100;
    let ty = -100;
    let x = tx;
    let y = ty;
    let px = tx;
    let py = ty;
    let lastPx = px;
    let shown = "";
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      px += (tx + 24 - px) * 0.14;
      py += (ty - 60 - py) * 0.14;
      const tilt = Math.max(-4, Math.min(4, (px - lastPx) * 0.6));
      lastPx = px;
      cur.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      preview.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tx + 24 - px) > 0.3 ? requestAnimationFrame(loop) : 0;
    };

    const showPreview = (key: string | undefined) => {
      if (key === shown) return;
      shown = key ?? "";
      if (!key) {
        preview.removeAttribute("data-on");
        return;
      }
      const [kind, id] = key.split(":");
      if (kind === "sample") {
        const src = document.querySelector(`[data-preview-page="${id}"] svg`);
        preview.replaceChildren(...(src ? [src.cloneNode(true)] : []));
        preview.toggleAttribute("data-on", Boolean(src));
      } else if (kind === "doc") {
        preview.replaceChildren();
        docThumb(id).then((c) => {
          if (shown !== key || !c) return;
          const copy = document.createElement("canvas");
          copy.width = c.width;
          copy.height = c.height;
          copy.getContext("2d")?.drawImage(c, 0, 0);
          preview.replaceChildren(copy);
          preview.setAttribute("data-on", "");
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = e.target as Element | null;
      const target = t?.closest<HTMLElement>("[data-cursor]");
      const mode = target ? target.dataset.cursor! : t?.closest("input, textarea, select, [contenteditable]") ? "text" : "";
      if (cur.dataset.mode !== mode) {
        cur.dataset.mode = mode;
        pill.textContent = mode === "copy" ? "Copy" : mode === "inspect" ? "Inspect ↗" : "";
      }
      showPreview(t?.closest<HTMLElement>("[data-preview]")?.dataset.preview);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      cur.dataset.mode = "away";
      showPreview(undefined);
    };
    // A click anywhere on a [data-cursor="copy"] block presses its copy button.
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const block = t?.closest<HTMLElement>('[data-cursor="copy"]');
      if (!block || t?.closest("button, a")) return;
      if (window.getSelection()?.toString()) return;
      block.querySelector<HTMLButtonElement>(".pm-acct-copy")?.click();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onClick);
      if (raf) cancelAnimationFrame(raf);
      cur.remove();
      preview.remove();
    };
  }, []);

  return null;
}

/** Runs before first paint (root layout): opts in to entrance states unless reduced motion is preferred. */
export const MOTION_BOOT = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.motion=""}catch(e){}`;
