import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { RAIL_STEP_EVENT, RAIL_USER_EVENT } from "@/components/evidence-rail/scan-intent";

/**
 * The home page's scroll-driven layer (DESIGN.md, Motion). Loaded by
 * home-motion.tsx after first paint, never under reduced motion. Everything
 * here starts from content that is already laid out and visible; the
 * hidden starting states live in CSS under html[data-gsap], which this
 * module sets and removes.
 *
 * Returns a cleanup that reverts every tween, kills every trigger and
 * destroys Lenis (route change, unmount).
 */
export function startHomeScroll(): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const root = document.documentElement;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const wide = window.matchMedia("(min-width: 1024px)").matches;
  const headH = () => (document.querySelector(".pm-mk-top") as HTMLElement | null)?.offsetHeight ?? 56;

  // Smooth scroll: Lenis, driven by GSAP's ticker so ScrollTrigger and the
  // scroll position never disagree.
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    anchors: { offset: -(headH() + 24) },
  });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  root.dataset.gsap = "";
  // In-page CTAs (Run the sample, Start a scan) scroll through Lenis when it runs.
  (window as Window & { pmLenis?: Lenis }).pmLenis = lenis;

  const cleanups: (() => void)[] = [];

  const ctx = gsap.context(() => {
    gsap.defaults({ ease: "power3.out", duration: 0.6 });

    /* ── hero → evidence rail ─────────────────────────────────────────── */
    const hero = document.querySelector<HTMLElement>(".pm-hero");
    const slot = document.querySelector<HTMLElement>(".pm-fly-slot");
    const fly = document.querySelector<HTMLElement>(".pm-fly");
    const flyPage = fly?.querySelector<HTMLElement>(".pm-fly-page") ?? null;
    const rail = document.querySelector<HTMLElement>('[data-testid="evidence-rail"]');
    const railPage = rail?.querySelector<HTMLElement>(".pm-rail-page") ?? null;
    const access = document.querySelector<HTMLElement>("#access");
    let railTaken = false;
    let stepST: ScrollTrigger | null = null;

    // Phones skip the travelling page: on a narrow screen it only covers the
    // rail it is about to become. The hero peek carries the first colour there.
    if (!mobile && hero && slot && fly && flyPage && rail && railPage && access) {
      root.dataset.fly = "";
      const state = { rise: 0, scan: 0, dock: 0 };
      const boxes = Array.from(fly.querySelectorAll<SVGGElement>(".pm-fly-box"));
      const tags = Array.from(fly.querySelectorAll<HTMLElement>(".pm-fly-tag"));
      const scan = fly.querySelector<HTMLElement>(".pm-fly-scan");
      const ease = gsap.parseEase("power2.inOut");
      const riseEase = gsap.parseEase("power3.out");

      const size = () => {
        const r = railPage.getBoundingClientRect();
        flyPage.style.width = `${r.width}px`;
        flyPage.style.height = `${r.height}px`;
      };
      size();

      const render = () => {
        const off = railTaken || rail.hasAttribute("data-live");
        if (off || state.dock >= 1) {
          fly.style.visibility = "hidden";
          rail.dataset.docked = "";
          return;
        }
        delete rail.dataset.docked;
        fly.style.visibility = "visible";
        const s = slot.getBoundingClientRect();
        const r = railPage.getBoundingClientRect();
        const d = ease(state.dock);
        const k = riseEase(state.rise);
        const w = s.width + (r.width - s.width) * d;
        const sc = (w / r.width) * (0.85 + 0.15 * k);
        const x = s.left + (r.left - s.left) * d + (w - r.width * sc) / 2;
        const lift = (1 - k) * Math.max(window.innerHeight * 0.6, window.innerHeight - s.top + 24);
        const y = s.top + (r.top - s.top) * d + lift;
        flyPage.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
        if (scan) {
          scan.style.transform = `translateY(${(state.scan * r.height).toFixed(1)}px)`;
          scan.style.opacity = state.scan > 0 && state.scan < 1 ? "1" : "0";
        }
        for (const el of [...boxes, ...tags]) el.toggleAttribute("data-on", state.scan >= Number(el.dataset.at));
      };

      const heroTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: mobile ? "+=40%" : "+=80%",
          pin: true,
          // The room for this pin is reserved in CSS from first paint
          // (html[data-motion] .pm-hero margin), so nothing below moves
          // when this script arrives after load.
          pinSpacing: false,
          scrub: 1,
        },
        onUpdate: render,
      });
      heroTl
        .to(state, { rise: 1, duration: 0.35 }, 0)
        .to(hero.querySelectorAll(".pm-hero-copy, .pm-sys, .pm-peek, .pm-hero > .pm-wrap > .pm-index"), { y: -96, opacity: 0, duration: 0.3 }, 0.02)
        .to(state, { scan: 1, duration: 0.55 }, 0.38)
        .to({}, { duration: 0.07 });

      // After the pin, the page docks into the rail as both scroll: its box
      // is interpolated from the hero slot to the rail's page, live.
      ScrollTrigger.create({
        trigger: access,
        start: () => (heroTl.scrollTrigger?.end ?? 0) + 1,
        end: () => access.getBoundingClientRect().top + window.scrollY - (headH() + 16),
        scrub: 0.6,
        onUpdate: (self) => {
          state.dock = self.progress;
          render();
        },
        onRefresh: (self) => {
          size();
          state.dock = self.progress;
          render();
        },
      });
      lenis.on("scroll", render);

      /* ── evidence rail: scroll steps through the findings ───────────── */
      const rows = rail.querySelectorAll(".pm-frow").length;
      const steps = Math.min(4, rows);
      const ticks = Array.from(document.querySelectorAll<HTMLElement>(".pm-rail-ticks li"));
      const sideBySide = window.matchMedia("(min-width: 1001px)").matches;
      const fits = access.offsetHeight <= window.innerHeight - headH() - 24;
      if (!mobile && sideBySide && fits && steps > 1) {
        let last = -1;
        stepST = ScrollTrigger.create({
          trigger: access,
          start: () => `top top+=${headH() + 16}`,
          end: () => `+=${steps * window.innerHeight * 0.45}`,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (railTaken) return;
            const i = Math.min(steps - 1, Math.floor(self.progress * steps));
            ticks.forEach((t, k) => t.toggleAttribute("data-on", k <= i));
            if (i === last) return;
            last = i;
            rail.dataset.stepping = "";
            window.dispatchEvent(new CustomEvent(RAIL_STEP_EVENT, { detail: i }));
          },
        });
      }

      // A click or key in the rail hands it to the visitor: scroll stops
      // driving it, the pin is released, and the rail stays exactly where it
      // is on screen.
      const onUser = () => {
        if (railTaken) return;
        railTaken = true;
        delete rail.dataset.stepping;
        render();
        if (stepST) {
          const before = access.getBoundingClientRect().top;
          stepST.kill(true);
          stepST = null;
          ticks.forEach((t) => t.closest(".pm-rail-ticks")?.setAttribute("hidden", ""));
          ScrollTrigger.refresh();
          lenis.scrollTo(access.getBoundingClientRect().top + window.scrollY - before, { immediate: true, force: true });
        }
      };
      window.addEventListener(RAIL_USER_EVENT, onUser);
      cleanups.push(() => {
        window.removeEventListener(RAIL_USER_EVENT, onUser);
        delete rail.dataset.docked;
        delete rail.dataset.stepping;
        delete root.dataset.fly;
      });
    }

    /* ── pipeline: a horizontal track, pinned ─────────────────────────── */
    const pipe = document.querySelector<HTMLElement>(".pm-pipe");
    const track = pipe?.querySelector<HTMLElement>(".pm-pipe-steps");
    if (pipe && track) {
      const steps = Array.from(track.querySelectorAll<HTMLElement>(".pm-pipe-step"));
      const doc = pipe.querySelector<HTMLElement>(".pm-pipe-doc");
      const progress = pipe.querySelector<HTMLElement>(".pm-pipe-progress");
      if (wide) {
        pipe.classList.add("pm-pipe--h");
        const travel = () => Math.max(0, track.scrollWidth - (track.parentElement?.clientWidth ?? window.innerWidth));
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pipe,
            start: "top top",
            end: () => `+=${travel() + window.innerHeight * 0.6}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
          onUpdate: () => {
            const p = tl.progress();
            steps.forEach((s) => s.toggleAttribute("data-on", p >= Number(s.dataset.at ?? 0)));
            const on = steps.filter((s) => s.hasAttribute("data-on")).length;
            if (doc) {
              doc.dataset.stage = String(Math.max(0, on - 1));
              const tw = track.scrollWidth;
              doc.style.transform = `translateX(${(p * tw - p * travel()).toFixed(1)}px)`;
            }
          },
        });
        tl.to(track, { x: () => -travel(), duration: 1 }, 0).fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
        const place = () => {
          const tw = track.scrollWidth || 1;
          steps.forEach((s) => (s.dataset.at = String(Math.max(0, (s.offsetLeft - 4) / tw))));
        };
        place();
        ScrollTrigger.addEventListener("refreshInit", place);
        cleanups.push(() => {
          ScrollTrigger.removeEventListener("refreshInit", place);
          pipe.classList.remove("pm-pipe--h");
          steps.forEach((s) => delete s.dataset.at);
        });
      } else {
        // Narrow: no pin; each step lights and types as it enters.
        steps.forEach((s) =>
          ScrollTrigger.create({ trigger: s, start: "top 80%", once: true, onEnter: () => s.toggleAttribute("data-on", true) }),
        );
        if (progress) gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: track, start: "top 80%", end: "bottom 60%", scrub: true } });
      }
    }

    /* ── markers: a diagonal stagger, then each drawing plays once ─────── */
    const grid = document.querySelector<HTMLElement>(".pm-mk-grid");
    if (grid) {
      const families = Array.from(grid.querySelectorAll<HTMLElement>(".pm-mk-family"));
      const cells = families.flatMap((f, col) => Array.from(f.querySelectorAll<HTMLElement>(".pm-mk-cell")).map((el, row) => ({ el, d: col + row })));
      gsap.set(cells.map((c) => c.el), { opacity: 0, y: 16 });
      ScrollTrigger.create({
        trigger: grid,
        start: "top 85%",
        once: true,
        onEnter: () => {
          cells.forEach(({ el, d }) => {
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: d * 0.06,
              onComplete: () => {
                if (!mobile) el.querySelector(".pm-mv")?.classList.add("is-play");
              },
            });
          });
        },
      });
    }

    /* ── outputs: the terminal opens, then the run types ──────────────── */
    const term = document.querySelector<HTMLElement>(".pm-term");
    if (term && !term.hasAttribute("data-run")) {
      gsap.set(term, { clipPath: "inset(50% 0% 50% 0%)" });
      ScrollTrigger.create({
        trigger: term,
        start: "top 80%",
        once: true,
        onEnter: () => gsap.to(term, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, onComplete: () => {
            term.dataset.run = "";
          } }),
      });
      // Scroll speed quickens the caret's blink, a little.
      const onVel = ({ velocity }: { velocity: number }) => {
        const ms = gsap.utils.clamp(320, 1100, 1100 - Math.abs(velocity) * 40);
        term.style.setProperty("--blink", `${Math.round(ms)}ms`);
      };
      lenis.on("scroll", onVel);
    }

    /* ── integrate & pricing ──────────────────────────────────────────── */
    ScrollTrigger.batch(".pm-way", {
      start: "top 85%",
      once: true,
      onEnter: (els) => els.forEach((el, i) => gsap.delayedCall(i * 0.08, () => (el as HTMLElement).toggleAttribute("data-on", true))),
    });

    const plans = document.querySelector<HTMLElement>(".pm-plans");
    if (plans) {
      const trs = plans.querySelectorAll("tr");
      gsap.set(trs, { opacity: 0, y: 12 });
      ScrollTrigger.create({
        trigger: plans,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(trs, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 });
          plans.querySelectorAll<HTMLElement>(".pm-plan-price .pm-mono").forEach((el) => scramble(el, 520, "0123456789"));
        },
      });
    }

    /* ── closing: the ink wipes in from the CTA ───────────────────────── */
    const close = document.querySelector<HTMLElement>(".pm-close");
    const bg = close?.querySelector<HTMLElement>(".pm-close-bg");
    const cta = close?.querySelector<HTMLElement>(".pm-close-cta");
    if (close && bg) {
      const origin = () => {
        const c = close.getBoundingClientRect();
        const b = (cta ?? close).getBoundingClientRect();
        return `${(((b.left + b.width / 2 - c.left) / c.width) * 100).toFixed(1)}% ${(((b.top + b.height / 2 - c.top) / c.height) * 100).toFixed(1)}%`;
      };
      gsap.fromTo(
        bg,
        { clipPath: () => `circle(0% at ${origin()})` },
        {
          clipPath: () => `circle(150% at ${origin()})`,
          ease: "none",
          immediateRender: true,
          scrollTrigger: { trigger: close, start: "top bottom", end: "top 70%", scrub: true, invalidateOnRefresh: true },
        },
      );
      const lines = close.querySelectorAll(".pm-close-title .pm-mask > span");
      gsap.set(lines, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: close.querySelector(".pm-close-title"),
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(lines, { yPercent: 0, duration: 0.7, stagger: 0.08, onComplete: () => close.querySelector(".pm-close-serif")?.setAttribute("data-on", "") }),
      });

      // The CTA leans toward the pointer (12px at most) and settles back.
      const mag = close.querySelector<HTMLElement>("[data-magnetic]");
      if (mag && window.matchMedia("(pointer: fine)").matches) {
        const xTo = gsap.quickTo(mag, "x", { duration: 0.35, ease: "power3.out" });
        const yTo = gsap.quickTo(mag, "y", { duration: 0.35, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = mag.getBoundingClientRect();
          xTo(gsap.utils.clamp(-12, 12, (e.clientX - (r.left + r.width / 2)) * 0.25));
          yTo(gsap.utils.clamp(-12, 12, (e.clientY - (r.top + r.height / 2)) * 0.25));
        };
        const leave = () => gsap.to(mag, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(0.6, 0.5)" });
        mag.addEventListener("pointermove", move);
        mag.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          mag.removeEventListener("pointermove", move);
          mag.removeEventListener("pointerleave", leave);
        });
      }
    }
  });

  // Fonts and the rail's first layout settle after load; measure again then.
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener("load", refresh);

  return () => {
    window.removeEventListener("load", refresh);
    cleanups.forEach((fn) => fn());
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.ticker.remove(tick);
    lenis.destroy();
    delete (window as Window & { pmLenis?: Lenis }).pmLenis;
    delete root.dataset.gsap;
  };
}

/** Scrambles an element's text through `glyphs` and resolves it left to right. */
function scramble(el: HTMLElement, ms: number, glyphs: string) {
  const node = el.firstChild;
  if (!(node instanceof Text)) return;
  const text = node.nodeValue ?? "";
  const o = { p: 0 };
  gsap.to(o, {
    p: 1,
    duration: ms / 1000,
    ease: "none",
    onUpdate: () => {
      node.nodeValue = [...text].map((c, i) => (i / text.length < o.p || !/\d/.test(c) ? c : glyphs[(Math.random() * glyphs.length) | 0])).join("");
    },
    onComplete: () => {
      node.nodeValue = text;
    },
  });
}
