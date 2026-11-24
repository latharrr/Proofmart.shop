# design-system.md — ProofMart

The objective reference for "Operator Console × Editorial Index". DESIGN.md
explains the system; this file is the checklist a reviewer measures against.
Tokens live once, in `web/src/app/globals.css` (`:root` plus `@theme inline`
for Tailwind 4). The earlier Lusion- and Steep-derived systems and the
working-paper system are retired (`design-system-steep.md`, `bar*.md` are
history only).

---

## 1. Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F2EFE8` | page background |
| `--paper-2` | `#E8E4DA` | recessed panels, hover fills, active sidebar item |
| `--doc` | `#FFFFFF` | document pages, inputs, code, system panel |
| `--ink` | `#0E0E0C` | text, primary buttons, index-row rule |
| `--ink-2` | `#55534D` | secondary text (6.7:1 on paper) |
| `--line` | `rgb(14 14 12 / .12)` | hairlines, grid, row rules |
| `--line-strong` | `rgb(14 14 12 / .36)` | control and card borders (≥3:1) |
| `--signal` | `#FF4D00` | brand accent: CTA hover, live, active nav, tabs, progress |
| `--signal-ink` | `#E64500` | accent as a ≥3:1 stroke: focus ring, caret |
| `--signal-text` | `#B83700` | accent as small text (5.1:1): index and step numbers, row arrows |
| `--fail` / `-ink` / `-wash` | `#C8102E` / `#B00E28` / 10% | FAIL only |
| `--review` / `-ink` / `-wash` | `#B07800` / `#805600` / 10% | REVIEW only |
| `--clear` / `-ink` / `-wash` | `#1F8A4C` / `#18703E` / 10% | CLEAR only |
| `--term` / `--term-text` / `--term-2` / `--term-line` | ink / paper / 70% / 12% | inverted sections |
| `--r` | `6px` | cards, buttons, inputs (layout is 0) |
| `--gutter` | `clamp(16px, 4vw, 48px)` | page side gutter |
| `--col-gap` | `24px` | 12-column gap |
| `--section` | `clamp(80px, 10vw, 160px)` | section padding |
| `--head-h` | `56px` | header height |
| `--t-12 … --t-120` | 12/14/16/20/28/44/72/120 (clamped) | the only type sizes |

Verdict text uses the `-ink` step; the base hue is for strokes, boxes and
pills' borders. Inverted sections use `--fail-on-ink #FF6B7D`,
`--review-on-ink #E8B04A`, `--clear-on-ink #4CC27E`.

## 2. Type

| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| display | Geist | `--t-120` | 500 | hero and closing line only |
| page title | Geist | `--t-72` | 500 | security, 404 |
| section title | Geist | `--t-44` | 500 | every home section, auth |
| title | Geist | `--t-20` | 500 | step and card names |
| body | Geist | 16 / 18 lead | 400 | ≥4.5:1 |
| body-sm | Geist | 14 | 400 | |
| mono | Geist Mono | 12–13 | 400–600 | figures, codes, hashes, labels, code; ligatures off |
| label | Geist Mono | 12 | 500 | uppercase, 0.06em |
| accent | Instrument Serif | inherits | 400 italic | 1–3 words per section |

All fonts load through `next/font/google` (self-hosted; CSP `font-src 'self'`).
Tabular numerals are global.

## 3. Layout checks

- [ ] Grid hairlines visible behind content (12 columns; 4 on ≤640px), light on inverted sections.
- [ ] Every home section opens with an index row `[nn] — LABEL ···· meta` on a 1px ink rule; numbers run 01–08 in page order.
- [ ] Section title in columns 1–7, aside in 9–12; collapses to one column ≤1000px.
- [ ] Only hero and closing use 120px; other section titles ≤44px.
- [ ] No horizontal page scroll at 1440 / 1024 / 768 / 390; nothing crosses the side gutter at 390.
- [ ] Hero peek (last rows of SAMPLE page 4, r14 REVIEW and r17 FAIL boxed) closes the first screen; on phones it drops to r / description / balance with the tag under the row.
- [ ] Pricing on ≤640px: the two plans side by side, each row label across above them.
- [ ] App shell: sidebar ≥961px, bar + Menu sheet below.
- [ ] Auth and 404: one centred bordered panel with an index row.

## 4. Colour checks

- [ ] `--signal` appears on no verdict; verdict hues appear on nothing but verdicts and markers.
- [ ] Every verdict shows glyph + word.
- [ ] Body and secondary text ≥4.5:1 at rest (no greyed-out copy).
- [ ] No shadows. No gradients except the hairline grid and link underlines.

## 5. Honesty checks (PRODUCT.md)

- [ ] Marker list rendered from `MARKER_REGISTRY` (home grid, hero count).
- [ ] Prices from `lib/billing/plans.ts`, shown in INR, with "Placeholder pricing — subject to change."
- [ ] Every illustrative artefact carries a SAMPLE badge (rail, outputs, hero page, hero peek, pipeline page).
- [ ] No customers, logos, testimonials, usage/accuracy/latency/uptime numbers, certifications, SLAs or integrations; no counters.
- [ ] Header says `API v1`, not "online" (there is no public health check).
- [ ] No AI/ML/score/confidence language about the engine.

## 6. Motion checks

- [ ] Under `prefers-reduced-motion: reduce`: no Lenis, pin, scrub, scramble, typing or magnetic pull; every final state shown; colours on hover still change.
- [ ] Only transform / opacity / clip-path / stroke-dashoffset animate.
- [ ] Hidden starting states exist only under `html[data-motion]` or `html[data-gsap]`.
- [ ] GSAP, ScrollTrigger and Lenis are dynamically imported after first paint, on the home page only, and torn down on unmount.
- [ ] CLS < 0.05; headlines never clip at rest; typed text has its full size reserved.
- [ ] The system cursor is always visible.
- [ ] Rail: scroll only switches findings; a click or key releases the pin in place.
