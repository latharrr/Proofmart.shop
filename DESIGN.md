---
name: ProofMart
description: Document forensics API, drawn as an operator console with an editorial index.
colors:
  paper: "#F2EFE8"
  paper-2: "#E8E4DA"
  doc: "#FFFFFF"
  ink: "#0E0E0C"
  ink-2: "#55534D"
  line: "rgb(14 14 12 / 0.12)"
  line-strong: "rgb(14 14 12 / 0.36)"
  signal: "#FF4D00"
  signal-ink: "#E64500"
  signal-text: "#B83700"
  fail: "#C8102E"
  fail-ink: "#B00E28"
  fail-wash: "rgb(200 16 46 / 0.1)"
  review: "#B07800"
  review-ink: "#805600"
  review-wash: "rgb(176 120 0 / 0.1)"
  clear: "#1F8A4C"
  clear-ink: "#18703E"
  clear-wash: "rgb(31 138 76 / 0.1)"
  term: "#0E0E0C"
  term-text: "#F2EFE8"
  term-2: "rgb(242 239 232 / 0.7)"
  term-line: "rgb(242 239 232 / 0.12)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(56px, 9vw, 120px)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.055em"
  page-title:
    fontFamily: "Geist"
    fontSize: "clamp(44px, 6vw, 72px)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.045em"
  section-title:
    fontFamily: "Geist"
    fontSize: "clamp(30px, 3.6vw, 44px)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"tnum\" 1"
  body-sm:
    fontFamily: "Geist"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  accent:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontStyle: "italic"
    fontWeight: 400
    note: "1–3 words per section at most"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"tnum\" 1; ligatures off"
  label:
    fontFamily: "Geist Mono"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.06em"
    textTransform: "uppercase"
  verdict:
    fontFamily: "Geist Mono"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.04em"
    textTransform: "uppercase"
scale: [12, 14, 16, 20, 28, 44, 72, 120]
rounded:
  layout: "0px"
  control: "6px"
  pill: "4px"
spacing:
  base: "4px"
  gutter: "clamp(16px, 4vw, 48px)"
  col-gap: "24px"
  section: "clamp(80px, 10vw, 160px)"
  wrap: "1360px"
  head: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    hover: "a {colors.signal} fill wipes in from the left (250ms); text turns {colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    border: "1px {colors.line-strong}"
    hover: "{colors.paper-2} wipe; border {colors.ink}"
  button-paper:
    backgroundColor: "{colors.doc}"
    border: "1px {colors.line-strong}"
  button-sm:
    height: "34px"
  input:
    backgroundColor: "{colors.doc}"
    border: "1px {colors.line-strong}"
    rounded: "{rounded.control}"
    height: "46px"
  card:
    backgroundColor: "{colors.paper}"
    border: "1px {colors.line-strong}"
    rounded: "{rounded.control}"
    shadow: "none"
  document-page:
    backgroundColor: "{colors.doc}"
    border: "1px {colors.line}"
    rounded: "0px"
  verdict-pill:
    typography: "{typography.verdict}"
    rounded: "{rounded.pill}"
    fail: "text {colors.fail-ink} on {colors.fail-wash}, border {colors.fail}"
    review: "text {colors.review-ink} on {colors.review-wash}, border {colors.review}"
    clear: "text {colors.clear-ink} on {colors.clear-wash}, border {colors.clear}"
  sample-badge:
    border: "1px dashed {colors.ink-2}"
    typography: "{typography.label}"
  index-row:
    typography: "{typography.label}"
    border-top: "1px {colors.ink}"
    number: "{colors.signal-ink}"
  header:
    height: "{spacing.head}"
    scrolled: "paper at 86% + 12px blur + bottom {colors.line}"
---

# Design System: ProofMart

## Overview

**Creative North Star: "Operator Console × Editorial Index"**

ProofMart is a precision instrument for engineers and risk reviewers. The page is a light console laid on a visible Swiss grid: twelve faint column hairlines run the full height of every page, and content snaps to them. Data is mono everywhere it is data: figures, codes, rows, hashes, labels. Real document evidence (a statement page on white, its findings boxed on their real coordinates) is the hero of every surface. One editorial voice, Instrument Serif italic, gives each section a few words of personality and nothing more.

It is light-first, calm and dense. It reads as a tool that has been used, not a landing page about one. The references are Stripe's developer pages, Linear, GitHub Advanced Security and the International Typographic Style. Like those, it states facts in a grid and lets the product be the picture.

**Key characteristics**
- A visible 12-column grid of hairlines behind everything; a light grid on inverted sections.
- Every section opens with a mono index row: `[02] — EVIDENCE RAIL ········ SAMPLE · 6 PAGES`.
- Geist for UI and headings at weight 500; Geist Mono for every figure, identifier and label; Instrument Serif italic for 1–3 words per section.
- One brand accent, --signal, for action and live state, never for a verdict. Three verdict hues for verdicts and markers only.
- Square layout, 6px controls, no shadows: 1px lines do the separating.
- Motion is mechanical and quiet: things draw, type, decode and dock. Nothing bounces.

## Colors

### Surfaces
- **Paper** (#F2EFE8): the page on every surface.
- **Paper 2** (#E8E4DA): recessed panels (the rail's document desk), hover fills, the active sidebar item, header blur.
- **Doc** (#FFFFFF): anything that came from somewhere else and should read as a real file: statement renders, inputs, code, the system panel, the hash chip. A white page with a 1px --line border reads as a PDF lying on the paper.

### Ink and lines
- **Ink** (#0E0E0C): text, primary buttons, the index rows' top rule.
- **Ink 2** (#55534D, 6.7:1 on paper): secondary text. Nothing is greyed out below 4.5:1.
- **Line** (12% ink): hairlines, grid lines, row rules. **Line strong** (36% ink, ≥3:1): control and card borders.

### Signal
- **Signal** (#FF4D00): the brand accent: primary-button hover fill, live dots, the active nav underline and sidebar item, tab indicators, the scroll progress bar, the pipeline line, index numbers, the scan line.
- **Signal ink** (#E64500): the same accent where it must meet 3:1 as a stroke on paper: the focus ring, the caret.
- **Signal text** (#B83700, 5.1:1): the accent as small text: index numbers, step numbers, row arrows, the active sidebar number.

### Verdict semantics (verdicts and markers only)
| Verdict | Hue (strokes, boxes, fills) | Text step (≥4.5:1) | Wash |
|---|---|---|---|
| FAIL | #C8102E | #B00E28 | 10% |
| REVIEW | #B07800 | #805600 | 10% |
| CLEAR | #1F8A4C | #18703E | 10% |

The specified hues fail 4.5:1 as text on paper (REVIEW 3.3, CLEAR 3.8), so text uses the darker step of the same hue. Inverted sections use lighter steps: #FF6B7D, #E8B04A, #4CC27E.

### Inverted "terminal" sections
Outputs and the close: ground --ink, text --paper, secondary text at 70%, hairlines at 12%.

### Named rules
**The Signal Is Not A Verdict Rule.** --signal never marks FAIL, REVIEW or CLEAR, and a verdict hue never marks brand, hover or decoration. Orange (#FF4D00) and FAIL red (#C8102E) sit far enough apart to never be confused.

**The Glyph Before Colour Rule.** Every verdict carries its glyph (✕ FAIL, ? REVIEW, ✓ CLEAR, — INCONCLUSIVE) and its word, so it reads in greyscale.

## Typography

- **Geist** (500 for headings, 400 for body), self-hosted through `next/font` (CSP `font-src 'self'`).
- **Geist Mono**: every amount, page/row address, marker code, key, hash, label and line of code. Ligatures off, tabular numerals.
- **Instrument Serif italic**: one to three words per section (`the row.`, `turns to it.`, `verdict.`). Never a whole sentence, never in the app surfaces' chrome.

**Scale:** 12 / 14 / 16 / 20 / 28 / 44 / 72 / 120. Only the hero and the closing line use 120. Section titles stay at 44 or below; app and auth page titles use 72 and 44.

**Tabular numerals on all numbers**, globally (`font-variant-numeric: tabular-nums`).

## Layout

- The wrap is 1360px plus a fluid gutter (16–48px). A 12-column grid with a 24px gap sits inside it; the hairlines mark each column start and the right edge (4 columns of lines on phones).
- The header is a thin 56px bar: wordmark, a mono IST clock and `● API v1` in the centre (there is no public health check, so it never says "online"), then the nav, account and "Get API key". It takes a paper blur and a hairline once scrolled, hides while scrolling down, returns on the way up, and carries a 1px --signal scroll-progress bar.
- Sections are padded clamp(80px, 10vw, 160px); two paper sections in a row share one gap.
- **Section head:** index row on a 1px ink rule, then the title in columns 1–7 and its aside in columns 9–12.
- **App shell:** a 232px sticky sidebar (wordmark, mono-indexed sections `01 Documents · 02 API keys · 03 Webhooks · 04 Billing`, then "Verify a document" and the account menu at its foot). Below 960px a thin bar and a Menu sheet replace it.
- **Auth and 404:** one centred, bordered panel on the grid, opening with a mono index row.
- Breakpoints: 1180 (header clock folds), 1040 (header nav folds into Menu), 1000 (rail stacks, outputs stack), 960 (sidebar becomes a bar; marker grid single column), 860, 640, 560.

## Elevation & shape

No shadows anywhere. Surfaces separate by stock (paper, paper 2, doc) and 1px lines. Layout is square; cards, buttons, inputs and the system panel take 6px; verdict pills and small chips take 4px. Dashed borders mean "not real or not yet": the SAMPLE badge and the drop zone.

## Components

### Index row (signature)
`[nn] — LABEL ···· meta` in 12px Geist Mono uppercase. The number is --signal-text, the leader is dotted, the top rule is 1px ink (paper text on inverted sections). On enter, the rule draws left to right, the leader fills and the number scrambles to its value.

### Evidence Rail (signature)
A bordered card. **Top bar:** filename, page count and size, a `sha256 37702289…d321 copy` chip (the real SHA-256 of the uploaded bytes; for the sample, of the sample's own page data), the overall verdict pill, SAMPLE and Copy JSON. **Left:** the document page on white over a paper-2 desk, with the pinned finding's box drawn on its real coordinates (stroke draws in 400ms, then the wash). **Right:** the findings as an index table, `No. / Marker / Verdict / Cite / ↗`, each row followed by its plain finding and the mono ledger the marker worked out, with `≠` in the FAIL colour on the line the document prints. Hover shifts a row 12px right, turns its arrow from -45° to 0 in --signal, and previews its box (dashed, pulsing). ↑/↓ move between findings, Enter pins, Esc clears. On phones the page stacks over the table and the top bar sticks under the header.

### System panel
A white mono card in the hero: `engine: deterministic rules`, `markers: N` (the registry's own length), `verdicts: FAIL > REVIEW > CLEAR`, `signing: Ed25519`, `delivery: web · api · webhooks · cli`, `billing: INR · Razorpay`, then a copyable curl line.

### Markers grid
A bordered 3 × 2 grid read straight from `MARKER_REGISTRY`, one column per family (Arithmetic → FAIL; Semantic and Extraction → REVIEW). Each cell: code, verdict pill, the registry's plain rule, and a small drawing of what it looks for. On hover the cell takes --paper-2 and a border in its verdict hue.

### Terminal
An inverted window with tabs (JSON report · Webhook payload · Signed dossier). It shows the CLI's real summary format, then token-coloured JSON. Keys that address the page (`page`, `rect`, `x`…) are dotted; hovering one lights the cited box on the page thumbnail beside it.

### Buttons, links, tabs
- **Buttons:** 44px (34px small), 6px radius. Primary is ink; on hover a --signal fill wipes in from the left over 250ms. Secondary and paper buttons wipe in --paper-2.
- **Links:** an underline that draws left to right in --signal on hover and leaves to the right.
- **Tabs:** mono labels with one 2px --signal indicator that slides to the selected tab.
- **Copy buttons:** "Copy" → "Copied ✓" (the label resolves from mono glyphs), back after 1.5s.

### Verdict pill
Mono 12px uppercase, its glyph first, in the verdict's text step on its wash inside a 1px border of the base hue.

### SAMPLE badge
Mono 10.5px uppercase in a dashed ink-2 border, on every piece of illustrative data.

### Secret reveal
The one inverted card in the app. The value is masked and blurred until clicked, then un-blurs; copy works either way.

## Motion

Exact, mechanical, quiet: transform, opacity, clip-path and stroke-dashoffset only, with `power3.out` for entrances and linear scrub. No bounces, blobs, 3D or glass. Two layers, both skipped entirely under `prefers-reduced-motion`, which shows every final state at once:

1. **CSS and IntersectionObserver** (`components/motion/motion-layer.tsx`, `html[data-motion]` set before first paint). **Page load:**
   - the grid hairlines draw top to bottom in a 40ms stagger;
   - the header slides down;
   - the hero lines rise out of their masks, the serif word 0.15s later with a skew that settles;
   - the system panel types at 18ms a character, a caret riding each row, then the curl line types and its Copy button fades in.

   **On scroll:**
   - body blocks rise 16px and fade in (400ms, started at 85% of the viewport);
   - headings rise while their glyphs decode;
   - index rows draw, fill and scramble.

   **Elsewhere:**
   - findings and document rows show an "Inspect ↗" label beside the system cursor (code blocks show "Copy"), plus a trailing page-1 thumbnail that leans up to 4° with horizontal speed. The system cursor is never hidden.
2. **The home page's scroll layer** (`components/motion/home-scroll.ts`: GSAP + ScrollTrigger + Lenis, dynamically imported after first paint).
   - **Smooth scroll:** Lenis, duration 1.1 with an expo-out easing, driven by GSAP's ticker.
   - **Hero → rail:** the hero pins (+80%, +40% on phones). A SAMPLE page rises under the headline while it lifts and fades. A 2px --signal scan line sweeps down the page, and each finding's box draws as the line reaches its row, then its wash, then its mono tag. After the pin the page docks into the Evidence Rail's own page, which it matches exactly.
   - **Rail:** while pinned (wide screens, when the rail fits under the header) scroll simply switches to the next finding, with ticks on the right edge. A click or key in the rail hands it back to the visitor and releases the pin in place.
   - **Pipeline:** at 1024px and up the section pins and its steps run along a horizontal track. The --signal line fills each node as it arrives and types its description, and a tiny SAMPLE page rides the line: raw page → text layer → table grid → boxes → FAIL. Narrower screens get the same reveals without a pin.
   - **Markers:** a diagonal stagger, then each drawing plays once (and loops on hover).
   - **Terminal:** opens from its middle, then the run types. Scroll speed quickens the caret.
   - **Integrate and pricing:** cell hairlines draw, icons stroke in, retry dots land in backoff order, plan rows reveal top to bottom, and prices scramble once.
   - **Close:** the ink wipes in as a circle from the CTA. The line rises out of its mask and the serif word gets a --signal underline. Behind it, a faint wall of sample pages lights a box now and then. The CTA leans up to 12px toward the pointer.

No layout shift: typed text is laid out at full size from the start, headlines never clip at rest, and pins live below the first screen.

## Do's and Don'ts

### Do
- Open every home section with its index row; number sections in order.
- Set every figure, code, address, hash and label in Geist Mono.
- Put real document evidence on white with a 1px line.
- Keep the serif to 1–3 words.
- Draw verdicts with glyph + word + hue; draw --signal only for action and live state.
- Label all illustrative data SAMPLE.

### Don't
- Don't invent customers, logos, testimonials, metrics, certifications, SLAs or integrations. No counters: there are no real metrics to count.
- Don't use AI, ML, score or confidence language for the engine; it is deterministic rules (`OCR_LOW_CONFIDENCE` is a marker's registry name, not a claim about the engine).
- Don't hard-code the marker list; read `MARKER_REGISTRY`.
- Don't add shadows, gradients (other than the hairline grid and link underlines), glass, 3D or bounce.
- Don't use --signal for a verdict, or a verdict hue for decoration.
- Don't hide the system cursor.
