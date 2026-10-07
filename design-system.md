# design-system.md — ProofMart

Derived from lusion.co, adapted for a document-forensics product.
This file is the **objective** reference: the System critic checks adherence against
it and nothing else. Where this file and `bar.md` disagree, `bar.md` wins.
The previous Steep-derived system is archived as `design-system-steep.md`.

---

## 1. Type

One grotesk for everything, plus a mono reserved for machine strings.

| Role | Family | Desktop | Mobile | Weight | Tracking | Line-height | Case |
|---|---|---|---|---|---|---|---|
| display | Geist | 148px | 60px | 400 | −0.045em | 0.95 | sentence |
| heading-lg | Geist | 88px | 44px | 400 | −0.04em | 1.0 | sentence |
| heading | Geist | 48px | 32px | 400 | −0.03em | 1.08 | sentence |
| heading-sm | Geist | 28px | 24px | 400 | −0.02em | 1.2 | sentence |
| body-lg | Geist | 22px | 18px | 400 | −0.01em | 1.4 | sentence |
| body | Geist | 17px | 16px | 400 | normal | 1.5 | sentence |
| label | Geist | 14px | 13px | 500 | 0.02em | 1.2 | UPPERCASE |
| identifier | Geist Mono | 13px | 12px | 400 | 0 | 1.5 | as data |

- Geist and Geist Mono load through `next/font/google` (CSP is `font-src 'self'`).
- Nothing on the page is bold. 500 is used only by `label`.
- Display and heading lines enter through a **line mask** (see §6).
- Mono is reserved for machine strings: marker IDs (`BALANCE_BREAK`), endpoints,
  request IDs, JSON, page/row coordinates, amounts inside a finding's arithmetic.
- Every page-chrome text size is one of the roles above. **Inside a 3D scene or a
  floating product artifact** (a reproduced statement, a finding card) the artifact
  may use its own internal scale, down to 10px for the reproduced document.

## 2. Colour

**Field and ink, the achromatic UI**

| Token | Hex | Role |
|---|---|---|
| field | `#f0f1fa` | page background |
| paper | `#ffffff` | cards, inputs, light pills, artifacts |
| haze | `#e4e6ef` | secondary pill, input rest fill, subtle panels |
| line | `#d9dbe6` | hairlines, crosshair marks at 40% ink, dividers |
| mute | `#6b6f80` | secondary text, helper text, inline links at rest |
| ink | `#0b0c10` | primary text, display type |
| graphite | `#2b2e3a` | primary pill, dark stages, dark bands |

**Electric accent**: only in 3D, ribbons, focus rings and one highlight per screen.

| Token | Hex | Role |
|---|---|---|
| volt | `#3b49f4` | 3D ribbon, focus ring, active nav dot, one emphasised word or line |
| volt-2 | `#5981fe` | gradient partner of volt, inside 3D/ribbons only |

**Verdict signal**: functional and exempt.

| Token | Hex | Role |
|---|---|---|
| fail | `#e5342b` | FAIL badge, pin box, fail count |
| review | `#c98a12` | REVIEW badge, review count |
| clear | `#1d9a63` | CLEAR badge, clear count |

Rules
- UI chrome uses only field/paper/haze/line/mute/ink/graphite plus volt.
- volt as a solid UI fill: at most one control per screen (e.g. the active step).
- Verdict colours never decorate. Red only ever means FAIL.
- Exception: the Google "G" on "Continue with Google" keeps its official colours.
- Dark bands (`graphite` background, `paper` text) are allowed for 3D stages and at
  most one content section per page.

## 3. Space and frame

- Base unit 4px. Component padding from {4, 8, 12, 16, 20, 24, 32}.
- Page gutter **72px** desktop, **20px** mobile. Max content width 1296px.
- Major section spacing **≥160px** desktop, **≥96px** mobile.
- **Crosshair marks**: `+` glyphs, 13px, `ink` at 40%, at the four corners of every
  framed stage or media frame and on its column lines. Same size and colour
  everywhere.

## 4. Shape and depth

| Element | Radius |
|---|---|
| pill (buttons, chips, nav) | 9999px |
| stage / media frame | 20px |
| card | 20px |
| input | 14px |

- Shadows only on things floating above the field (artifacts, popovers, the
  account menu): `0 1px 2px rgba(11,12,16,.06), 0 12px 32px -8px rgba(11,12,16,.18)`.
  Flat content cards have no shadow.
- **Perspective:** depth moves use `perspective: 1200px`. Card tilt at most 8° on any
  axis. Media planes may enter from up to 12° and settle at 0°.

## 5. Components

- **Primary pill:** graphite fill, paper label, `label` type, padding 16px 24px
  (min-height 48px), optional 6px dot after the label.
- **Secondary pill:** haze fill (or paper on haze surfaces), ink label, same metrics.
- **Icon pill:** 48px circle, haze.
- **Pill hover:** label rolls up (the label translates −100% while a duplicate rises
  from +100%) in 300ms `--ease-out`; background shifts one step in 400ms. No lift,
  no scale.
- **Inline link:** `mute` at rest with a `→` suffix and no underline, `ink` on hover;
  the arrow nudges 4px right.
- **Input:** paper fill, 1px line border, 14px radius, padding 14px 16px; focus is a
  2px volt ring.
- **Stage:** 20px radius, crosshair marks, a 3D canvas or media inside, a designed
  poster frame shown until the 3D is ready (same composition, no layout shift).
- **Finding row:** paper, 3px left edge in the verdict colour, mono identifier, body
  description, mono arithmetic on haze.

## 6. Motion

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.4, 0, 0.1, 1)` |
| `--ease-scene` | `cubic-bezier(0.35, 0, 0, 1)` |
| UI duration | 300–450ms |
| reveal duration | 900ms, stagger 80ms per line |
| scene duration | 800–1400ms |

- **Line reveal:** each display or heading line sits in an `overflow: hidden` box and
  rises from `translateY(105%)` to 0. This is the only text entrance.
- **Block reveal:** non-text blocks rise 32px and fade in 900ms `--ease-scene`,
  triggered on entering the viewport. Content is visible at rest without JS
  (progressive enhancement).
- **Scroll-linked:** stage scale or recede, perspective tilt to flat, ribbon path
  draw, parallax layers (0.85×–1.15× scroll speed).
- No springs, no overshoot, no bounce, no linear UI tweens.
- `prefers-reduced-motion: reduce`: the 3D renders one static pose, reveals are
  instant, and scroll-linked motion is off.

## 7. 3D

- three.js (`three` package), client-only, loaded lazily after first paint. The page
  is usable before it loads.
- Physically based materials (`MeshPhysicalMaterial` / `MeshStandardMaterial`),
  an environment map for reflections, soft shadows or contact shadows, gentle depth.
- Cursor parallax: the scene eases toward the pointer (damped, never snapping).
- Device pixel ratio capped at 2. Pause rendering when off-screen or the tab is hidden.
- Mobile: fewer objects, no cursor; still real 3D on the home hero.
- Subject matter is documents: paper sheets, statement rows, the pin box, the
  verdict. No abstract blobs.

## 8. Hard don'ts

1. No bold display type, no serif.
2. No hue in UI chrome outside volt and the verdict colours.
3. No verdict colour used decoratively or as a hover state.
4. No shadow on a flat content card.
5. No button that isn't a full pill, and no sentence-case button label.
6. No spring, overshoot or bounce easing.
7. No content hidden behind a loader; the first frame is the product.
8. No underline on an inline link at rest.
9. No mono on prose.
10. No layout shift when 3D or media loads.
