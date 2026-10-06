# bar.md — the craft bar

**Reference:** https://steep.app (refero: *Steep — "serif analytics on warm paper"*)
**Measured:** 2026-09-16, Chromium 1440×900 @2x, computed styles + stylesheet extraction.
**Judged against:** rendered output only. Never the code.

Seven mechanisms. Every one is checkable by looking at a screenshot or a filmstrip.
A critic that cannot point at the pixel that fails a line has not found a failure.

---

## 1. The display face is a serif at 400 weight, and only 400

Hero display **90px**, tracking **−2.25px**. Section heads **64px**, tracking **−1.6px**.
Body and all UI is sans. Measured on steep.app: `90px w400 ls-2.25px Signifier`, `64px w400 ls-1.6px Signifier`, `16px w400 Sohne`.

- **Fail if:** a headline renders in sans, or any serif renders above weight 400, or display tracking is looser than −0.02em.
- **Ours today:** Instrument Sans 72px w500. Every headline on the site fails this.

## 2. Emphasis inside a headline is carried by *italic serif* — never colour, weight, or underline

steep.app: "AI analytics for faster insights and *zero chaos*" — the payload phrase is italic, same size, same weight, same colour.

- **Exactly one** italic phrase per headline. **At most one** headline per page uses it.
- **Fail if:** a headline emphasises with a colour span, a bolder weight, a highlight, or an underline. Or if two phrases in one headline are italic.
- **Ours today:** `on the record.` is emphasised with a grey colour span (`#43494F`). Fails.

## 3. Product artifacts float free and bleed past the viewport edge

Above the fold, steep.app has **four** floating UI cards; **three are cropped by the viewport edge** (Region card cut off left, Registrations cut off right, Activation cut off bottom-left). None sits inside a bordered container.

- At least **two** artifacts above the fold, **at least one cropped by an edge**. White surface, 20px radius, three-layer soft shadow.
- **Fail if:** every product visual is fully contained, centred, or sits inside a visible frame/border.
- **Crop on a boundary, never through the proof.** The reference can crop its cards because their contents are ambient — a number, a label, a sparkline. Ours carry the argument: the arithmetic that proves a finding, and the response shape a developer is evaluating. A crop that severs `84,210.00 + 12,500.00 = 96,7` or `"summary": "Running balanc` has taken the one thing the page exists to show and made it unreadable.
  The bleed must fall on a structural seam — a preview pane, a column gutter, a chart's far edge — so that everything load-bearing stays wholly inside the viewport and only context runs off it.
  **Fail if:** any clipped edge cuts through a number, a JSON key/value, a marker ID, or a line of running text.
- **Ours today:** one Evidence Rail, fully contained, inside a grey panel, nothing bleeds. Fails.

## 4. The page is 97% achromatic, with one warm accent used at most once

Measured background inventory: white, `#17191c`, `#f7f7f8`, `#ececec` dominate. Peach `#fbe1d1` appears **3 times in the whole document**. Sienna `#5d2a1a` only ever on peach.

- **Fail if:** a second chromatic hue appears anywhere decorative, or the peach surface appears more than once per page, or sienna appears off-peach.
- **ProofMart adaptation — read this, it is the one place we deliberately break the reference:**
  `FAIL` / `REVIEW` / `CLEAR` colours are **functional signal, not decoration**. A forensics product cannot render a verdict in greyscale. They are exempt from this rule and stay saturated. Everything that is *not* a verdict obeys the achromatic rule — including the current red `#B4231F` used as a brand accent in the eyebrow and logo, which must go achromatic or become peach.
  A critic must not fail a page for showing red on a FAIL badge. It *must* fail a page for red anywhere else.

## 5. Buttons are pills, cards are 24px, and only floating artifacts get a shadow

Measured: buttons `border-radius: 9999px`. Cards 24px, elevated 20px, inputs 16px. Content cards have **no shadow**; only the floating artifacts carry `subtle-3`.

- Exactly **one filled** button per cluster, paired with a **ghost**. Never two filled side by side.
- **Fail if:** any button is not fully pill. Any card is below 16px radius. Any static content card has a drop shadow.
- **Ours today:** `--pm-r-control: 2px`, `--pm-r-card: 6px`, `--pm-r-panel: 10px`. Every control on the site fails this.

## 6. Enter motion is one gesture, 500ms, and nothing else

Extracted keyframes from steep.app:
```
@keyframes fade-in-y { 0% { opacity:0; transform: translateY(10px) } 100% { opacity:1; transform: translateY(0) } }
.animate-fade-in-y { animation: 0.5s ease-out 0s 1 normal forwards }
.animation-delay-300 { opacity: 0; animation-delay: 0.3s }
```
- **10px** of travel. **500ms**. **ease-out**. **300ms** stagger. Opacity and translateY only.
- **Fail if:** anything scales in, slides horizontally, bounces, springs, blurs in, or travels more than ~12px. If two different enter animations appear on one page, that is a fail.
- **Ours today:** 620ms, 14px travel, `cubic-bezier(0.16,1,0.3,1)`. Close, but slower and softer than the bar.

## 7. Hover is colour-only and fast — the one exception is the arrow

Measured on steep.app buttons:
```
transition-property: color, background-color, border-color, outline-color, fill, stroke
transition-duration: 0.2s
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)
```
Secondary/icon controls: `0.15s`, same curve. **No transform on hover anywhere.**

The single exception is the link arrow, which wraps rather than slides:
```
@keyframes arrow-slide-frames { 0%{translate(0)} 50%{translate(100%)} 51%{translate(-100%)} 100%{translate(0)} }
```
- Inline text links are **not underlined at rest** — the `→` suffix carries the affordance.
- **Fail if:** a button lifts, scales, or shifts on hover. If hover takes longer than 250ms. If inline links are underlined at rest.
- **Ours today:** `pm-hoverable` transitions `transform` and `box-shadow` over 220ms — controls lift on hover. Fails.

---

## Not mechanisms — do not let these into a critique

- "Feels premium", "looks clean", "more modern", "needs more polish" — unfalsifiable. Reject.
- Copywriting quality. The Brief critic owns whether the page does its job; craft does not rewrite headlines.
- Anything requiring the implementation to be read. Screenshots and filmstrips only.

## Known conflict, resolved once, here

Steep sells *editorial calm*. ProofMart sells *evidence*. Where the two collide, the resolution is fixed:
**adopt Steep's system entirely, except that verdict state stays loud.** The serif, the pills, the achromatic field and the 500ms fade are not in tension with forensics — they make the red mean something, because nothing else on the page is red.
