/** Scrolls an element into view through Lenis when the scroll layer runs, natively otherwise; instant under reduced motion. */
export function scrollToEl(el: Element, block: "start" | "center" = "start") {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = (window as Window & { pmLenis?: { scrollTo: (t: Element, o: { offset: number }) => void } }).pmLenis;
  if (lenis && !reduced) {
    const head = (document.querySelector(".pm-mk-top") as HTMLElement | null)?.offsetHeight ?? 56;
    const r = el.getBoundingClientRect();
    lenis.scrollTo(el, { offset: block === "center" ? -(window.innerHeight - r.height) / 2 : -(head + 8) });
    return;
  }
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block });
}
