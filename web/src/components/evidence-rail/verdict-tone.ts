import type { Verdict } from "@/lib/evidence-data";

/**
 * Verdict signal for the rail and its finding rows, in the design system's
 * verdict tokens (design-system.md §2). Hex rather than var() because these
 * also feed SVG presentation attributes (the pin box). Functional only: a
 * verdict colour marks what a finding *is*, never what the pointer is doing.
 */
export const TONE: Record<Verdict, { color: string; wash: string; glyph: string }> = {
  FAIL: { color: "#e5342b", wash: "rgba(229,52,43,0.10)", glyph: "×" },
  REVIEW: { color: "#c98a12", wash: "rgba(201,138,18,0.12)", glyph: "~" },
  CLEAR: { color: "#1d9a63", wash: "rgba(29,154,99,0.10)", glyph: "=" },
  INCONCLUSIVE: { color: "#6b6f80", wash: "rgba(107,111,128,0.10)", glyph: "?" },
};
