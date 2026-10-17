import type { Verdict } from "@/lib/evidence-data";
import { VERDICT_TICK } from "@/components/paper/tickmark";
import type { TickKind } from "@/components/paper/tickmark";

/**
 * Verdict signal for the rail and its finding rows, in the working-paper
 * pencils (DESIGN.md, Colour): red pencil for a break, blue pencil for a
 * query, graphite for a tick. Hex rather than var() because these also feed
 * SVG presentation attributes (the pencil ring). Functional only: a verdict
 * colour marks what a finding *is*, never what the pointer is doing, and
 * every verdict also carries its tickmark so it reads without colour.
 */
export const TONE: Record<Verdict, { color: string; wash: string; tick: TickKind }> = {
  FAIL: { color: "#bf3020", wash: "rgba(191,48,32,0.10)", tick: VERDICT_TICK.FAIL },
  REVIEW: { color: "#1f4f9a", wash: "rgba(31,79,154,0.10)", tick: VERDICT_TICK.REVIEW },
  CLEAR: { color: "#2a2d30", wash: "rgba(42,45,48,0.06)", tick: VERDICT_TICK.CLEAR },
  INCONCLUSIVE: { color: "#5d635c", wash: "rgba(93,99,92,0.08)", tick: VERDICT_TICK.INCONCLUSIVE },
};
