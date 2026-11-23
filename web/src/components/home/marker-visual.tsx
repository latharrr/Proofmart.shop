import type { ReactNode } from "react";


/**
 * A small live drawing of what each marker looks for, keyed by marker id.
 * Pure SVG in currentColor (the cell sets it to the verdict hue); the
 * motion is CSS, on hover, and off under reduced motion. A marker added to
 * the registry without a drawing simply renders none.
 */
const VISUALS: Record<string, ReactNode> = {
  // A running balance that steps off its line.
  BALANCE_BREAK: (
    <>
      <path className="pm-mv-base" d="M4 34 L24 28 L44 30 L64 22" />
      <path className="pm-mv-hit" d="M64 22 L72 12 L96 14 L116 8" />
      <path className="pm-mv-ghost" d="M64 22 L84 18 L104 20 L116 16" strokeDasharray="3 3" />
    </>
  ),
  // Page 3's closing total against page 4's opening.
  CROSS_PAGE_TOTAL_MISMATCH: (
    <>
      <rect className="pm-mv-base" x="6" y="6" width="44" height="32" />
      <rect className="pm-mv-base" x="70" y="6" width="44" height="32" />
      <path className="pm-mv-base" d="M12 30h32M76 14h32" />
      <path className="pm-mv-hit" d="M44 30 L54 30 M66 14 L76 14" />
      <path className="pm-mv-hit pm-mv-x" d="M56 18l8 8M64 18l-8 8" />
    </>
  ),
  // Dates in order, then one that goes back.
  DATE_SEQUENCE_ANOMALY: (
    <>
      <path className="pm-mv-base" d="M8 34V26M28 34V20M48 34V14" />
      <path className="pm-mv-hit pm-mv-drop" d="M68 34V28" />
      <path className="pm-mv-base" d="M88 34V8M108 34V4" />
      <path className="pm-mv-base" d="M4 38h112" />
    </>
  ),
  // Two rows that match on date and amount.
  DUPLICATE_TRANSACTION: (
    <>
      <path className="pm-mv-base" d="M6 8h108M6 18h108M6 28h108M6 38h108" opacity=".35" />
      <rect className="pm-mv-hit" x="6" y="9" width="108" height="8" />
      <rect className="pm-mv-hit pm-mv-twin" x="6" y="29" width="108" height="8" />
    </>
  ),
  // A glyph the text layer can't vouch for.
  OCR_LOW_CONFIDENCE: (
    <>
      <path className="pm-mv-base" d="M10 30 L18 10 L26 30 M13 23h10" />
      <path className="pm-mv-base" d="M36 10v20h10" />
      <path className="pm-mv-hit pm-mv-blur" d="M58 10h12a6 6 0 0 1 0 12h-12zM58 22h14a6 6 0 0 1 0 8H58z" />
      <path className="pm-mv-base" d="M90 10h20M100 10v20" />
    </>
  ),
  // A character code that maps to no glyph.
  ENCODING_ANOMALY: (
    <>
      <rect className="pm-mv-base" x="8" y="8" width="28" height="28" />
      <path className="pm-mv-base" d="M16 28 L22 14 L28 28M18 24h8" />
      <path className="pm-mv-base" d="M44 22h16M54 16l6 6-6 6" />
      <rect className="pm-mv-hit" x="70" y="8" width="28" height="28" />
      <path className="pm-mv-hit pm-mv-x" d="M78 16l12 12M90 16l-12 12" />
    </>
  ),
};

export default function MarkerVisual({ id }: { id: string }) {
  const v = VISUALS[id];
  if (!v) return null;
  return (
    <svg className="pm-mv" viewBox="0 0 120 44" aria-hidden="true">
      {v}
    </svg>
  );
}
