/** Scrolls an element into view through Lenis when the scroll layer runs, natively otherwise; instant under reduced motion. */
export function scrollToEl(el: Element, block: "start" | "center" = "start") {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = (window as Window & { pmLenis?: { scrollTo: (t: number, o: { force: boolean }) => void } }).pmLenis;
  if (lenis && !reduced) {
    // A plain document offset, measured now: Lenis's own element lookup
    // misreads positions under the hero's fixed pin.
    const head = (document.querySelector(".pm-mk-top") as HTMLElement | null)?.offsetHeight ?? 56;
    const r = el.getBoundingClientRect();
    const offset = block === "center" ? Math.max(head + 8, (window.innerHeight - r.height) / 2) : head + 8;
    lenis.scrollTo(Math.max(0, r.top + window.scrollY - offset), { force: true });
    return;
  }
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block });
}
