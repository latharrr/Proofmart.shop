# design-system.md — ProofMart

Derived from the Steep system (https://steep.app), adapted for a document-forensics product.
This file is the **objective** reference. The System critic checks adherence against this and nothing else.
Where this file and `bar.md` disagree, `bar.md` wins — it describes the bar, this describes our tokens.

---

## 1. Type

| Role | Family | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| display | Instrument Serif | 90px | 400 | −2.25px | 1.05 |
| heading-lg | Instrument Serif | 64px | 400 | −1.6px | 1.1 |
| heading | Instrument Serif | 44px | 400 | −0.66px | 1.15 |
| heading-sm | Instrument Sans | 26px | 450 | −0.23px | 1.18 |
| body-lg | Instrument Sans | 20px | 450 | normal | 1.35 |
| body | Instrument Sans | 17px | 400 | normal | 1.5 |
| caption | Instrument Sans | 15px | 400 | normal | 1.5 |
| identifier | IBM Plex Mono | 12px | 400 | 0.06em | 1.5 |

**Font choices.** Signifier and Sohne are commercial. Free equivalents, both already on Google Fonts:
- **Instrument Serif** replaces Signifier. Ships 400 + a true italic and *nothing else* — it cannot violate the weight rule.
- **Instrument Sans** replaces Sohne. Already installed in `layout.tsx`.
- **IBM Plex Mono** stays, already installed. Mono is **not** in the Steep system; it is ours, and it is reserved.

**Rules**
- Serif is display only. Never body, never UI, never below 44px.
- Serif never leaves weight 400. Italic is the only variant permitted.
- Mono is reserved for machine strings: marker IDs (`BALANCE_BREAK`), endpoints (`/v1/verify`), request IDs, JSON, page/row coordinates, amounts inside a finding's arithmetic. Never for prose, never for labels that are merely technical-sounding.
- Body text never below 15px.
- **Every size on the page is one of the eight roles above.** The page's own
  chrome uses no size that is not in that table.

  An earlier draft of this file capped a viewport at four distinct sizes. That
  was invented rather than measured, and the reference does not obey it: a
  count of steep.app's own fold returns **six** distinct sizes (90, 22, 18, 16,
  15, 14). The constraint that actually describes the bar is that every size is
  a role, not that there are few of them.

- **A product artifact carries its own internal scale.** The Evidence Rail
  reproduces an application looking at a document, and neither an app's labels
  nor a bank statement's fine print is page prose. Inside an artifact:
  - the artifact's own UI chrome never goes below **11px**;
  - the reproduced document may go smaller, because it is a photograph of a
    printed page — a statement's CIN line and column headers are 9-10px in
    life, and setting them at 15px would make the specimen look forged.

  This carve-out covers only what is inside a floating artifact. Page chrome
  gets no such licence.

## 2. Colour

**Achromatic field — everything that is not a verdict**

| Token | Hex | Role |
|---|---|---|
| ink | `#17191c` | primary text, filled buttons, logo |
| paper | `#ffffff` | canvas, elevated surfaces |
| mist | `#f2f2f3` | content cards, input fills |
| fog | `#fafafb` | alternating section bands, hover surfaces |
| slate | `#777b86` | links, muted helper text |
| ash | `#979799` | tertiary labels, category tags |
| smoke | `#a3a6af` | placeholders, disabled |
| hairline | `#ececec` | borders, dividers |

**Warm accent — max one surface per page**

| Token | Hex | Role |
|---|---|---|
| peach | `#fbe1d1` | accent card background, once per page |
| sienna | `#5d2a1a` | text and strokes **on peach only** |

**Verdict signal — functional, exempt from the achromatic rule**

| Token | Hex | Role |
|---|---|---|
| fail | `#B4231F` | `FAIL` badges, fail finding rail edge, fail count |
| review | `#8A6A1F` | `REVIEW` badges, review rail edge, review count |
| clear | `#1F6B4A` | `CLEAR` badges, clear count |

Verdict colours appear **only** on verdict semantics. Never a brand accent, never a decorative rule, never a hover state, never the logo mark, never the eyebrow.

## 3. Space

Base unit **4px**. Scale: `4 8 12 16 20 24 28 32 40 64 80 96 124 128 160`.

- Page max-width **1200px**
- Section gap **80px**
- Card padding **20px**
- Element gap **8px**
- Component padding uses 4/8/12/16/20/24 only

## 4. Shape

| Element | Radius |
|---|---|
| buttons, pills, badges | `9999px` |
| content cards | `24px` |
| elevated / floating artifacts | `20px` |
| inputs, small cards | `16px` |
| images, screenshots | `12px` |

Nothing renders at a radius between 1px and 11px. The old `--pm-r-control: 2px`
/ `--pm-r-card: 6px` / `--pm-r-panel: 10px` scale is retired.

**Radius belongs to surfaces.** An element earns a radius by having a surface at
rest — a fill, a border on all sides, or a shadow. A cell that is defined only by
the rule between it and its neighbour is a row in a table, not a card, and takes
**no radius at all**. Zero is the absence of a radius, not a small one, and is
the correct value for the marker catalog's rows and the integrate grid's columns.

Getting this wrong in either direction is visible: a 24px radius on a full-width
divider-separated row bends the hairline away from the row's own corners, and a
6px radius on a card reads as the retired scale.

## 5. Elevation

```
--shadow-subtle:   oklab(0 0 0 / .05) 0 0 0 1px, rgba(0,0,0,.08) 0 4px 24px;
--shadow-modal:    oklab(0 0 0 / .05) 0 0 0 1px, rgba(0,0,0,.10) 0 8px 40px;
--shadow-artifact: rgba(4,23,43,.05) 0 0 0 1px,
                   rgba(0,0,0,.10) 0 20px 25px -5px,
                   rgba(0,0,0,.10) 0 8px 10px -6px;
```
Content cards get **no shadow** — they are separated by `mist` fill, not elevation.
Only floating product artifacts use `--shadow-artifact`. At most two shadow styles per page.

## 6. Motion

```
--ease-enter: ease-out;                        /* 500ms */
--ease-hover: cubic-bezier(0.4, 0, 0.2, 1);    /* 200ms */
```

| Event | Property | Duration | Easing |
|---|---|---|---|
| enter (scroll reveal) | `opacity 0→1`, `translateY 10px→0` | 500ms | ease-out |
| enter stagger | per sibling | 300ms offset | — |
| hover (primary) | colour / background / border only | 200ms | `cubic-bezier(.4,0,.2,1)` |
| hover (secondary, icon) | colour only | 150ms | `cubic-bezier(.4,0,.2,1)` |
| link arrow | `translateX 0→100%, −100%→0` | 300ms | ease-out |
| logo marquee | `translateX` loop | 50s | linear |

- **No transform on hover.** No lift, no scale, no shift.
- One enter gesture for the whole site. Travel never exceeds 12px.
- `prefers-reduced-motion: reduce` → all enter animation removed, elements visible at first paint. Non-negotiable; the reveal's resting state is `opacity: 0`.

## 7. Components

- **Button, filled** — `ink` bg, white text, `9999px`, padding `12px 20px`, 17px w450.
- **Button, ghost** — transparent, `ink` text, 1px `ink` border, `9999px`. Pairs with filled. **Never two filled side by side.**
- **Content card** — `mist` bg, `24px`, no shadow, 20px padding.
- **Accent card** — `peach` bg, `sienna` text, `24px`. Once per page. Only on a white section.
- **Floating artifact** — white, `20px`, `--shadow-artifact`, may bleed past the viewport edge.
- **Input / composer** — white, `16px`, `hairline` border, `smoke` placeholder.
- **Inline link** — `slate`, no underline at rest, `→` suffix carries affordance, underline on hover only.
- **Finding row** — white, 3px left edge in the verdict colour, mono identifier, sans description, mono arithmetic block on `mist`.

## 8. Hard don'ts

1. No sans headline above 44px, no serif at any weight but 400.
2. No chromatic hue outside peach/sienna and the three verdict colours.
3. No verdict colour used decoratively.
4. No shadow on a content card.
5. No radius below 12px.
6. No transform on hover.
7. No second enter animation.
8. No underline on an inline link at rest.
9. No peach on a non-white section background.
10. No mono on prose.
