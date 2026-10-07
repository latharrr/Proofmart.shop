# Design foundation — usage

The law: `/bar.md` and `/design-system.md`. This is how to use the shared pieces.
Everything below respects `prefers-reduced-motion` and is visible without JS.

## Tokens (`src/app/globals.css`, `/* ── foundation ── */` block)

- Colour: `--field --paper --haze --line --mute --ink --graphite`, accent `--volt --volt-2 --volt-gradient`,
  verdicts `--fail --review --clear` (+ `--fail-wash --review-wash --clear-wash` badge fills).
- Space: `--space-1…8` (4–32px), `--space-12/16/24/40`, `--gutter` (72/20), `--content-max` 1296, `--section-gap` (160/96).
- Shape: `--r-pill --r-stage --r-card` (20) `--r-input` (14), `--shadow-float` (floating things only), `--perspective` 1200px.
- Motion: `--ease-out` (UI), `--ease-scene` (reveals, scenes), `--dur-ui` 300, `--dur-ui-bg` 400, `--dur-reveal` 900, `--stagger` 80, `--dur-scene` 1100.
- Type sizes: `--fs-display --fs-heading-lg --fs-heading --fs-heading-sm --fs-body-lg --fs-body --fs-label --fs-identifier` (fluid desktop↔mobile).
- Fonts: `--font-sans` (Geist), `--font-mono` (Geist Mono). The old `--pm-*` names still work and now point at the new values; prefer the new names.
- Classes: `.pm-t-display .pm-t-heading-lg .pm-t-heading .pm-t-heading-sm .pm-t-body-lg .pm-t-body .pm-t-label .pm-t-mono`,
  `.pm-wrap` (gutters + max width), `.pm-inline-link` (mute + → nudge).
- `body` already has the field background and ink colour.

## Motion — `@/components/motion` (or each file directly)

| Import | Props | Notes |
|---|---|---|
| `LineReveal` from `@/components/motion/line-reveal` | `as` (tag, default `div`), `className`, `style`, `delay` ms, any HTML attrs | Masked per-line rise on entering view. Children: text, inline elements (kept whole), `<br/>`. Pair with a `.pm-t-*` class. Client. |
| `Reveal` from `@/components/motion/reveal` | `as`, `delay` ms (siblings `i*80`), `className`, `style`, HTML attrs | 32px rise + fade, 900ms. For blocks/paragraphs, not headings. Client. |
| `RollPill` from `@/components/motion/roll-pill` | `variant` `"primary"\|"secondary"\|"paper"`, `dot` `true\|"before"\|"after"`, `icon`, `size` `"md"\|"sm"`, `block`, `className`. With `href` → next/link (all Link props); `href`+`native` → plain `<a>`. Without `href` → `<button>` (`type` defaults `"button"`; `disabled`, `pending`, `pendingLabel`, `ref`, all button attrs incl. `form`, `formAction`, `onClick`). | Uppercase label, roll hover. Server-safe (no JS). `pending` disables + sets `aria-busy`. |
| `Frame`, `Crosshair` from `@/components/motion/frame` | `columns` (marks on internal column lines), `marks` `"both"\|"top"\|"bottom"\|"none"`, `tone` `"graphite"\|"paper"\|"haze"\|"field"`, `aspect` (e.g. `"16 / 9"`), `label` (centred in bottom row), `as`, `className`, `style`, `stageClassName`, `stageStyle` | 20px-radius stage with `+` mark rows above/below (in flow, 23px each). `Crosshair` = one 13px mark. Server-safe. |
| `Tilt` from `@/components/motion/tilt` | `max` deg (≤8), `damping`, `as`, `className`, `style`, `innerClassName`, `innerStyle` | Damped pointer tilt, flat on leave. Off for touch / reduced motion. Client. |
| `useScrollProgress(ref, { range, onChange, reducedValue })` from `@/components/motion/scroll-progress` | `range` `"cover"\|"enter"\|"exit"` | Returns a ref (`.current` 0→1), no re-renders. Feed it to `DocumentStage progress`. |
| `ScrollVar` (same file) | `range`, `as`, `className`, `style`, `progressRef(cb)` | Writes `--p` (0→1) on itself. Ready-made CSS: `.pm-scroll-recede` (scale by `--recede`, default .12), `.pm-scroll-tilt` (12°→0 as it enters; use `range="enter"`), `.pm-parallax` (set `--parallax: <px>`). |

## 3D — `@/components/three/document-stage`

```tsx
import DocumentStage from "@/components/three/document-stage";

<Frame columns={4} tone="graphite" aspect="1296 / 660" label="Scroll to explore">
  <DocumentStage variant="hero" tone="graphite" progress={progressRef} preload />
</Frame>
```

Props: `variant` `"hero"|"stack"|"single"` · `tone` `"graphite"|"light"` (match the stage background:
graphite on dark stages, light on field/haze/paper) · `verdict` `"FAIL"|"REVIEW"|"CLEAR"` · `progress`
(number or ref, 0→1: pages fan out, the set recedes, the ribbon draws on) · `interactive` (cursor
parallax, default true) · `ribbon` (default true; hero/stack only) · `restProgress` (reduced-motion pose,
default 0) · `preload` (above-the-fold hero) · `poster` (path, or `false`) · `label` (aria) · `className`,
`style`, `onReady`, `onLost`.

- It **fills its parent**: the parent must have a size (`Frame aspect`, or explicit height).
- Transparent canvas: the stage background comes from the parent (`Frame tone`).
- three.js loads only when the stage is within 400px of view; a poster (`/public/scene/<variant>-<tone>[-review|-clear].webp`,
  a real render) shows until the first frame, then the canvas fades over it. No layout shift.
- The camera "contains" each variant's box, so any aspect works. On narrow portrait stages use
  `variant="stack"` (the hero composition is wide and gets small). Posters assume `ribbon` on and progress 0.
- Pauses off-screen and on hidden tabs; DPR ≤ 2 (1.5 on mobile); static pose under reduced motion.
- Each stage is one WebGL context — keep it to ~4 per page.
- Regenerating posters after changing the scene: in dev, mount a stage with `poster={false}`,
  `interactive={false}` at the variant's `SCENE_FRAMES` aspect (`scene-frames.ts`), then run
  `window.__pmScene.capture("image/webp", 0.84)` and save the data URL to `public/scene/`.
