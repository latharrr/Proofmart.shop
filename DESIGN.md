---
name: ProofMart
description: Document forensics API, drawn as a chartered accountant's working paper.
colors:
  paper: "#e7ecdf"
  paper-2: "#dde4d3"
  sheet: "#eef2e8"
  print: "#fbfbf7"
  rule: "#c6d2bd"
  rule-col: "#adbfa5"
  rule-strong: "#708a6b"
  ink: "#222527"
  ink-2: "#464b4f"
  ink-3: "#5d635c"
  red: "#bf3020"
  red-wash: "rgb(191 48 32 / 0.1)"
  blue: "#1f4f9a"
  blue-wash: "rgb(31 79 154 / 0.09)"
typography:
  display:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.1rem, 5.8vw, 5.4rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.034em"
  headline:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 3.9vw, 3.4rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.026em"
  headline-page:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 4.4vw, 3.6rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"lnum\" 1, \"tnum\" 1"
  body-sm:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  verdict:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
    fontFeature: "\"liga\" 0, \"calt\" 0, \"tnum\" 1"
  figure-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    fontFeature: "\"liga\" 0, \"calt\" 0, \"tnum\" 1"
rounded:
  none: "0px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  head: "68px"
  gutter: "clamp(16px, 4vw, 48px)"
  section: "clamp(72px, 9vw, 132px)"
  wrap: "1360px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.print}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "#0f1112"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-2}"
  button-paper:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "46px"
  button-sm:
    padding: "0 14px"
    height: "36px"
  input:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "46px"
  chip:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  tab:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.none}"
    padding: "10px 16px 9px"
  tab-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  printout:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  dossier:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "22px 24px 18px"
  secret-sheet:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.none}"
  wp-ref:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.red}"
    typography: "{typography.figure}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  sample-label:
    textColor: "{colors.blue}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
  verdict-fail:
    textColor: "{colors.red}"
    typography: "{typography.verdict}"
  verdict-review:
    textColor: "{colors.blue}"
    typography: "{typography.verdict}"
  verdict-clear:
    textColor: "{colors.ink}"
    typography: "{typography.verdict}"
  verdict-inconclusive:
    textColor: "{colors.ink-3}"
    typography: "{typography.verdict}"
  nav-link:
    textColor: "{colors.ink-2}"
  nav-link-active:
    textColor: "{colors.ink}"
  header-bar:
    backgroundColor: "{colors.paper}"
    height: "68px"
---

# Design System: ProofMart

## Overview

**Creative North Star: "The Audit Working Paper"**

Every ProofMart surface is a chartered accountant's working paper lying on a pad of pale green columnar analysis paper. Figures are written in graphite, footed and cross-footed, and each one that agrees gets a small pencil tick. When a figure does not agree, the reviewer strikes it through and rings it in red pencil, then writes the sum that disproves it in the margin. A figure that can't be settled yet gets a blue query. The product's verdicts (FAIL, REVIEW, CLEAR) are those same three marks, so the whole interface reads as a checked document rather than a dashboard about one.

The density is the density of a schedule: ruled rows, column rules, tabular figures, labels set like column heads, and double rules where a sheet or section closes. Colour is almost entirely paper and graphite. The two pencils are instruments, not decoration: red appears where something broke, blue where something is queried or still to be set. Depth is literal and single. A sheet, a printout or the dossier lies on the pad and casts one soft shadow onto the desk; nothing else floats. Motion is the hand at work: pencil marks draw themselves and nothing else moves.

The world rejects the dark developer-tool landing page (a headline, two buttons and a code block on black) and the AI-trust gradient. One world covers every surface: home and security at full intensity, then auth, documents, the report, account (API keys, webhooks, billing) and the 404 in the same paper at a quieter pitch.

**Key Characteristics:**
- Pale green analysis paper, faint row rules, stronger column rules, double rules that close a sheet.
- Graphite for type and figures; red pencil for breaks; blue pencil for queries; graphite ticks for clear.
- An authored SVG tickmark set is the icon system, and every verdict carries its mark as well as its colour.
- Libre Franklin for headings, UI and prose; JetBrains Mono with ligatures off for every figure, identifier and line of code.
- Square corners everywhere; the only rounded form is a hand-drawn pencil ring.
- One shadow: a sheet lying on the desk.
- Only pencil marks move, and under reduced motion they are already drawn.

## Colors

Paper and graphite carry almost every pixel; two pencils carry meaning.

### Primary
- **Graphite** (ink): All headings, figures, body emphasis, the primary button's fill, active nav, and the CLEAR tick. It is the hand that wrote the paper.

### Secondary
- **Red Pencil** (red): The reviewer's pencil. It marks breaks: FAIL verdicts, struck and ringed figures, margin arithmetic, form errors and invalid fields. Because it is the reviewer's own hand, it also writes the paper's reference marks: the W/P letter boxed beside each section head, the sheet reference (B-4) on the statement, the tick in the brand mark, and the one red word in the hero title.
- **Red Wash** (red-wash): The tint behind a pinned FAIL finding. Error panels use the same pencil at half that strength under a red border. Never a fill for anything else.

### Tertiary
- **Blue Pencil** (blue): Queries. REVIEW verdicts, the SAMPLE label on any illustrative data, blanks still to be filled (the sign-off line), values the user is about to set, the caret, text selection and the focus outline.
- **Blue Wash** (blue-wash): The tint behind a callout that asks something of the reader and behind a pinned REVIEW finding.

### Neutral
- **Analysis Pad Green** (paper): The page background on every surface; the pad everything lies on.
- **Deep Pad Green** (paper-2): Tab backs, ledger header rows, secondary-button hover, and the desk area under a PDF page in the Evidence Rail.
- **Working Sheet** (sheet): A sheet lying on the pad: the statement sheet, the Evidence Rail, ledgers, the sign-off block, active tabs, menus.
- **Printout White** (print): Paper from somewhere else: the bank's PDF page, JSON responses, code, the signed dossier, inputs and the paper button.
- **Row Rule** (rule): Row rules and internal dividers.
- **Column Rule** (rule-col): Vertical rules between columns in tables, ledgers and the JSON gutter.
- **Closing Rule** (rule-strong): Sheet borders, table head underlines, input and chip strokes, and the 3px double rule that closes a sheet, a header or a section.
- **Graphite 2** (ink-2): Secondary prose, ledger cells, inactive nav.
- **Graphite 3** (ink-3): Labels, column heads, meta lines, line numbers, INCONCLUSIVE and PENDING.

### Named Rules
**The Two Pencils Rule.** Red pencil means "this broke" (or is the reviewer's own reference mark); blue pencil means "this is queried or still to be set". Neither is ever used for emphasis, hover, branding colour fields or decoration.

**The Mark Before Colour Rule.** Every verdict is written with its tickmark and its word: break with FAIL, query with REVIEW, agreed tick with CLEAR, dash with INCONCLUSIVE. A verdict must read correctly in greyscale.

**The Paper Is Green Rule.** The greens are paper and rules only. No green is ever a status colour: CLEAR is graphite, not green.

## Typography

**Display Font:** Libre Franklin (with ui-sans-serif, system-ui)
**Body Font:** Libre Franklin
**Label/Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** Libre Franklin is the gothic printed on ledger pads and bank forms: set at weight 600 with tight negative tracking it gives sheet titles their weight without shouting. JetBrains Mono is the figure column, where every digit must sit under the one above it. Both are self-hosted through next/font.

### Hierarchy
- **Display** (600, clamp(3.1rem, 5.8vw, 5.4rem), 0.95): The home hero sheet title only. One word may be written in red pencil.
- **Headline** (600, clamp(2.1rem, 3.9vw, 3.4rem), 1.02): Home and security section heads, set on a double rule with a W/P reference.
- **Headline, page** (600, clamp(2.3rem, 4.4vw, 3.6rem), 1): The title of an app, auth or 404 page. A smaller step (clamp(1.7rem, 3vw, 2.6rem), 1.08) is used for long titles such as filenames, which may break anywhere.
- **Title** (600, 1.3rem, 1.2): Card and panel heads inside a sheet.
- **Body** (400, 16.5px, 1.55): Prose and UI, with lining tabular figures switched on globally. Notes cap at 82ch, leads at about 36em.
- **Body small** (400, 14.5px, 1.5): Hints, definitions, notes.
- **Label** (600, 12px, 0.08em, uppercase, Graphite 3): Column heads, field labels, the tickmark legend title, panel captions such as VERDICT and FINDINGS.
- **Verdict** (700, 12.5px, 0.06em, uppercase): A verdict as written, beside its tickmark. A large step (22px) heads the report.
- **Figure** (JetBrains Mono 13px, 1.7): Statement rows, JSON, code, amounts, IDs. Meta lines and sheet notes drop to 11 to 12.5px.

### Named Rules
**The Figures Are Mono Rule.** Every amount, balance, page and row address, finding code, key, ID and line of code is JetBrains Mono, right-aligned in columns, with tabular numerals.

**The Literal Glyph Rule.** JetBrains Mono's coding ligatures are switched off ("liga" 0, "calt" 0) wherever it is used, so "->" and "===" show exactly the characters the API or the statement contains.

## Layout

The page is a pad of columnar paper. Content sits in one wrap (1360px plus a fluid gutter of clamp(16px, 4vw, 48px) each side) under a sticky 68px header strip closed by a double rule. Home sections are separated by clamp(72px, 9vw, 132px) and each opens on its own double rule with the headline on the left and a supporting aside or the W/P reference on the right.

On the home hero the pad shows its ruling: a 32px row rule and a 120px column rule drawn behind the content. The hero splits about 40/60 between the sheet title and the statement sheet, and the tickmark legend runs along its foot. App pages use a head block (back link, title, meta, then description and actions on the right) closed by a double rule, then a main area that is usually a two-column split (findings beside the page viewer, list beside detail).

Spacing is tight and schedule-like, built on a 4px step: 8 and 12px inside rows and controls, 16 to 24px inside sheets, 40px between a heading and its table. Tables keep 28px statement rows and 16 to 18px ledger cell padding.

Breakpoints are content-driven rather than a fixed scale (about 1100, 1080, 960, 860, 760, 640 and 560px). Under 1100px the header nav folds into a full-width paper menu panel. Under about 1080px two-column splits stack. Under 760px ledgers collapse to stacked rows, each still closed by row rules and the tfoot keeping its double rule.

## Elevation & Depth

The system is flat paper with exactly one shadow. A sheet lying on the desk (the statement sheet, the Evidence Rail and its PDF page, printouts, the dossier, the secret-key sheet) casts a hairline contact edge plus a long, soft, low shadow tinted with pad green. Everything else (headers, ledgers, tabs, menus, cards inside a sheet) is separated by rules and paper stock alone: Working Sheet on Analysis Pad, Printout White on Deep Pad Green.

### Shadow Vocabulary
- **Desk** (`box-shadow: 0 1px 0 rgb(34 37 39 / 0.05), 0 22px 44px -28px rgb(38 52 34 / 0.45)`): A sheet resting on the pad. Never on a button, a menu, a tab or a hover state.

### Named Rules
**The Desk Rule.** If a surface is not a separate piece of paper lying on the pad, it has no shadow. Stacking is shown with stock and rules, never with lift.

## Shapes

Every corner is square (0px): buttons, inputs, chips, tabs, sheets, menus, the dossier. Borders do the work radius would do elsewhere: 1px Closing Rule round sheets, 1.5px strokes on controls and reference boxes, and a 3px double rule wherever something is closed (a sheet head, a header strip, a section top, a table foot, the dossier frame). Dashed strokes mean "not yet filled": the drop zone, preset suggestions, the shown-once secret.

The one curved form is the pencil ring: an open, slightly overshooting ellipse drawn round a disputed figure, the way a reviewer circles by hand. Tickmarks are drawn on a 16-unit grid with a 1.7 stroke and round caps; the arrow uses a 1.6 square-capped stroke. Stamps (such as "Shown once · not stored") are boxed and rotated -1.5deg, the only rotated element in the system.

### Named Rules
**The Double Rule Closes Rule.** A sheet, a section head, a header and a table total are closed by a 3px double rule in Closing Rule. A single rule only separates rows.

## Components

### Buttons
Graphite blocks with a straight edge: confident, plain, written rather than pressed.
- **Shape:** Square corners (0px), 1.5px border, 46px tall (36px small), Libre Franklin 600 at 15px (14px small).
- **Primary:** Graphite fill, Printout White text. For the one forward action on a view (Start a scan, Verify a document, Get access, Download dossier).
- **Secondary:** Transparent with a graphite border; hover fills with Deep Pad Green.
- **Paper:** Printout White fill with a Closing Rule border that turns graphite on hover; for low-stakes actions beside a primary.
- **Forward arrow:** An optional pencil arrow after the label nudges 3px right on hover.
- **States:** Pressing shifts the button down 1px. Disabled or busy drops to 55% opacity and the label swaps to its pending text. Focus is the global 2px blue-pencil outline at 3px offset.

### Chips
- **Style:** 32px tall, Printout White, 1.5px Closing Rule border, 13px Franklin 600. Square icon buttons share the same stroke at 32px square.
- **State:** Border turns graphite on hover. Presets that suggest a value use a 1.25px dashed border that becomes solid when pressed.

### Cards / Containers (sheets)
- **Corner Style:** Square (0px).
- **Background:** Working Sheet for working panels, Printout White for anything printed (PDF page, JSON, code, dossier), Deep Pad Green for a recessed tone, Graphite only for a secret shown once.
- **Shadow Strategy:** Desk shadow only when the container is a separate sheet on the pad (see Elevation & Depth).
- **Border:** 1px Closing Rule; the dossier uses a 3px double graphite rule. A caption may be ruled off along the foot in 12px mono Graphite 3.
- **Internal Padding:** 14 to 24px, with internal sections separated by row rules.

### Inputs / Fields
- **Style:** 46px tall, Printout White, 1.5px Closing Rule stroke, square, Franklin 500 at 15px (mono 14px for URLs and secrets). Placeholder in a muted graphite; caret in blue pencil.
- **Hover / Focus:** Hover darkens the stroke to Graphite 2. Focus sets the stroke to graphite and adds a 3px blue-pencil ring at 25% opacity.
- **Error:** The stroke turns red pencil and the message is written beneath it in red pencil, Franklin 600 at 14.5px. A form-level error is a Printout panel with a red border, a faint red wash and a red title.

### Navigation
- **Header strip:** Sticky, 68px, Analysis Pad Green, closed by a 3px double rule. Wordmark left, links next, actions right.
- **Links:** Franklin 500 at 15px in Graphite 2. Hover and current page turn graphite with a 2px underline at 7px offset; the current page in the app is also set at 600.
- **Mobile:** Below 1100px the links fold into a full-width paper panel under the header: 22px Franklin 600 rows on row rules, each with a small boxed mono index, and the account and primary action at the foot.

### Tickmarks (signature)
The icon system. Six authored SVG marks, all paths in currentColor: agreed (tick), footed (tick over a rule), cross-footed (tick over a double rule), query (a pencil question mark), break (a cross) and none (a dash). Verdicts map to them fixed: FAIL to break, REVIEW to query, CLEAR to agreed, INCONCLUSIVE to none. A legend explaining the marks runs at the foot of the home hero, as it would on a real working paper.

### Statement Sheet (signature)
A bank statement page re-footed as a working paper: a head with title, red-pencil sheet reference and SAMPLE label over a double rule, then a fixed-layout table of 28px rows in mono with column rules, a tick column and a note column, and a double-ruled foot carrying the total. Breaks are struck through and ringed in red pencil with the arithmetic in the note column; queried rows turn blue. On first view the ticks draw down the column in reading order (360ms each, 70ms apart), the ring draws round the disputed balance last, and the margin notes write in after their mark.

### Evidence Rail and Findings
The live product surface: a Working Sheet with a double-ruled head (filename and meta in mono), a Deep Pad Green pane holding the PDF page as a Printout on the desk, and a findings list. Each finding row shows its code in mono, its verdict, the plain-language finding, the arithmetic in a Printout box and its page address. Pinning a finding tints the row with its pencil's wash and draws a ring round the region on the page (520ms, expo ease-out); under reduced motion the ring is simply there.

### Reference Marks
- **W/P reference:** A red-pencil box in mono 13px ("W/P C") pinned to the right of a section head; it is how other sheets cite this one.
- **SAMPLE label:** A blue-pencil box in mono 10.5px, uppercase, on every piece of illustrative data.
- **Stamp:** A boxed uppercase stamp rotated -1.5deg, used for a one-time condition such as a key shown once.

## Do's and Don'ts

### Do:
- **Do** write every verdict with its tickmark and its word, in its pencil: break and FAIL in red, query and REVIEW in blue, agreed tick and CLEAR in graphite.
- **Do** set every figure, address, code and identifier in JetBrains Mono with ligatures off and tabular numerals, right-aligned in its column.
- **Do** close sheets, header strips, section heads and totals with a 3px double rule in Closing Rule.
- **Do** give the desk shadow only to a separate sheet on the pad: statement sheet, rail, PDF page, printouts, dossier, secret sheet.
- **Do** label illustrative data with the blue SAMPLE box.
- **Do** animate only pencil marks (stroke-dashoffset with cubic-bezier(0.16, 1, 0.3, 1)), and show them already drawn under reduced motion.
- **Do** use the pad's own ruling (repeating-linear-gradient rules) where the paper itself should show.

### Don't:
- **Don't** use red or blue for emphasis, hover, links or decoration; red marks a break or a reviewer's reference, blue marks a query or a value to set.
- **Don't** make CLEAR green or introduce any status colour beyond graphite and the two pencils.
- **Don't** round a corner. The pencil ring is a mark, not a shape to borrow for containers or buttons.
- **Don't** add shadows to buttons, menus, tabs or hover states, and don't stack lifted cards.
- **Don't** use a gradient for anything except ruling the pad.
- **Don't** use icon fonts or stock icon sets; new icons are drawn in the tickmark idiom (16-unit grid, currentColor, round-capped strokes).
- **Don't** fall back to the dark developer-tool landing or an AI-trust gradient; graphite fills are for primary buttons and the shown-once secret only.
- **Don't** put an uppercase label above a headline as a kicker; labels are column heads and field labels.
