# bar.md — the craft bar

**Reference:** https://lusion.co (home), captured 2026-10-07, Chromium 1440×900 with GPU.
**Replaces:** the Steep bar (archived as `bar-steep.md`). The owner rejected the calm,
flat result; this bar asks for real-time 3D and choreographed motion.
**Judged against:** rendered output only: screenshots, scroll filmstrips, cursor and
hover captures. Never the code.

Seven mechanisms. Each one is checkable by looking. A critic that can't point at the
frame or pixel that fails a line hasn't found a failure.

---

## 1. The hero is a live 3D scene, lit like a product shot, inside a framed stage

Lusion opens on a real-time WebGL scene: glossy and matte 3D objects with specular
highlights, soft shadows and depth of field. It sits in a **rounded stage**
(~20px radius) inset from the page gutters, and **the scene responds to the cursor**:
objects drift and rotate toward the pointer.

- **ProofMart adaptation:** the scene is made from the subject itself, never abstract
  blobs: 3D document pages or statement sheets, a pinned finding box, the verdict. It
  must read as "a document being examined" in the first frame.
- **Fail if:** the hero has no real 3D (a flat image, a CSS gradient, an SVG
  pretending), the objects are flat-shaded with no highlight or shadow, the scene
  ignores the cursor (two cursor captures 400px apart show the same frame), or the
  scene is abstract decoration unrelated to documents.

## 2. Scroll moves things in depth, not only in opacity

Lusion's scroll filmstrip changes the 3D composition: the hero stage scales and
recedes, a 3D **ribbon in the accent blue** sweeps through and behind the headline,
and media planes **tilt in perspective** (visible rotateX/rotateY or skew) before
settling flat.

- At least **two** scroll-linked depth moves per page on marketing: stage scale or
  recede, perspective tilt of cards or media, a 3D ribbon or path, layered parallax.
- **Fail if:** a scroll filmstrip of 8+ frames shows only fades or plain slide-ups,
  or every element moves at the same speed (no parallax layers), or a depth move
  jitters or tears between frames.

## 3. Display type is huge, regular weight, tightly set, and reveals by line

Measured: headline ~150px at 1440 (`Bold Ideas, / Brought to Life`), weight 400,
negative tracking, one grotesk family for everything. Supporting copy ~22px w400.
Labels and buttons are **14px w500, uppercase**. Headlines enter **line by line from a
mask**: each line slides up from below its own clipping box, staggered.

- Display ≥ 120px desktop and ≥ 56px mobile, weight 400, tracking ≤ −0.03em.
- **Fail if:** a display headline is bold (≥ 600), under those sizes, set in a serif,
  or appears all at once with a plain fade instead of a per-line masked rise.

## 4. Light cool field, ink controls, one electric accent

Measured: page field `#f0f1fa` (cool lavender-white), ink `#000`, dark pill `#2b2e3a`,
light pill `#e4e6ef`, accent blue `#3b49f4`→`#5981fe` used on the 3D ribbon and
highlights. Colour lives in the 3D and the media. The UI chrome is achromatic.

- **ProofMart adaptation:** `FAIL` / `REVIEW` / `CLEAR` stay as functional verdict
  colours, exempt. The verdict red is the only red anywhere.
- **Fail if:** UI chrome (buttons, text, borders, cards) uses a hue other than the accent
  blue or a verdict colour; or the accent appears as flat UI fill on more than one
  control per screen; or red appears outside a verdict.

## 5. Pills with a dot, and the label rolls on hover

Measured: buttons are full pills (radius ≥ height/2), uppercase 14px w500, many carry a
small **dot** indicator. On hover the **label rolls**: the text slides up and an
identical copy rises from below. `transform 0.3s cubic-bezier(0.4,0,0.1,1)`, background
`0.4s`. Primary is the dark `#2b2e3a` pill; secondary is the light `#e4e6ef` or white
pill.

- **Fail if:** a button isn't a full pill, its label is sentence case, hover is only a
  colour change (no roll), or hover is slower than 450ms or uses a bouncy or overshoot
  curve.

## 6. The page is drawn on a measured frame, and the frame is visible

Lusion marks its grid with **`+` crosshair marks** at the corners and column lines of
framed media, at fixed gutters (72px desktop). Media, video and 3D stages sit in
rounded frames (~20px radius) on that grid. Sections breathe: at least 160px
between major sections on desktop.

- **Fail if:** framed media or 3D stages have no structural marks at all on a page that
  has them elsewhere (inconsistent), gutters differ between sections, or two major
  sections sit closer than 120px on desktop.

## 7. Motion has one easing family and nothing feels cheap

Measured curves: `cubic-bezier(0.4,0,0.1,1)` and `cubic-bezier(0.35,0,0,1)`, both
fast-out and long-settle. Durations 300–600ms for UI and 800–1400ms for scene moves.
3D runs at a steady frame rate.

- Under `prefers-reduced-motion` the page shows a **still, fully composed** frame:
  the 3D renders one static pose, and reveals are instant. Nothing is hidden or broken.
- **Fail if:** any spring or overshoot bounce, any linear tween on UI, visible frame
  drops or stutter in the 3D filmstrip, layout shift when the 3D loads, or a blank
  stage while it loads (it needs a designed poster or placeholder frame).

---

## Not mechanisms — do not let these into a critique

- "Feels premium", "more wow", "needs more polish": unfalsifiable. Reject.
- Copywriting quality belongs to the Brief critic.
- Anything that requires reading the implementation.

## Known conflicts, resolved once, here

- **Lusion is a studio showreel. ProofMart is a product.** Adopt the craft: 3D stage,
  scroll depth, masked type, roll-hover pills, crosshair frame, easing. Don't adopt
  the loader or the "PLAY REEL" theatre. **No intro loader that blocks content.**
  The first frame shows the product within 1s.
- **App pages (auth, documents, account) are tools.** They carry the same
  type, pills, colour, frame and easing (mechanisms 3–7, with display sizes scaled
  to the page). Each one also carries **one** 3D or depth moment where it helps, such
  as a 3D document stack beside the auth form or a tilt-on-hover report card. They
  don't need a full-screen scene, and nothing animates in a way that slows a task.
- **Mobile:** the lusion mobile capture never finished loading in headless Chromium,
  so it's blind. On mobile, judge against the desktop mechanisms scaled down. The 3D
  may simplify (fewer objects, no cursor) but must still be real 3D on the home hero.
