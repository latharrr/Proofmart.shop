import type { Verdict } from "@/lib/evidence-data";
import { VERDICT_TICK } from "@/components/paper/tickmark";
import type { TickKind } from "@/components/paper/tickmark";

/**
 * Verdict semantics for the rail's boxes and rows (DESIGN.md, Colour): the
 * three verdict hues, used for verdicts and markers only, never for brand or
 * hover. Hex rather than var() because these also feed SVG presentation
 * attributes. Every verdict also carries its glyph, so it reads without
 * colour. Keep in step with --fail / --review / --clear in globals.css.
 */
export const TONE: Record<Verdict, { color: string; wash: string; tick: TickKind }> = {
  FAIL: { color: "#C8102E", wash: "rgba(200,16,46,0.10)", tick: VERDICT_TICK.FAIL },
  REVIEW: { color: "#B07800", wash: "rgba(176,120,0,0.10)", tick: VERDICT_TICK.REVIEW },
  CLEAR: { color: "#1F8A4C", wash: "rgba(31,138,76,0.10)", tick: VERDICT_TICK.CLEAR },
  INCONCLUSIVE: { color: "#55534D", wash: "rgba(85,83,77,0.08)", tick: VERDICT_TICK.INCONCLUSIVE },
};
