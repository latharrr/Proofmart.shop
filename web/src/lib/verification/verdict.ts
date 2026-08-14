import type { Verdict, VerificationFinding } from "./types";

/**
 * Deterministic, explainable verdict precedence — no LLM, no scoring model.
 *
 * Precedence (highest first): FAIL > REVIEW > INCONCLUSIVE-from-findings is
 * not a thing (a finding is never itself "INCONCLUSIVE" in a way that beats
 * REVIEW — see note below) > CLEAR.
 *
 * The four cases, in the exact order they're checked:
 *
 * 1. Zero markers had sufficient evidence to run at all
 *      → INCONCLUSIVE   ("insufficient evidence to judge")
 * 2. At least one marker ran, and any finding has verdict FAIL
 *      → FAIL            ("confirmed failure findings")
 * 3. At least one marker ran, no FAIL, but at least one finding has
 *    verdict REVIEW or INCONCLUSIVE (a marker ran but could only produce a
 *    low-confidence/ambiguous finding, not "nothing to see")
 *      → REVIEW          ("review-only findings")
 * 4. At least one marker ran and produced zero findings, or every finding
 *    somehow carries no signal (unreachable today, guarded regardless)
 *      → CLEAR           ("no findings")
 *
 * A finding's own `verdict` is typed `Exclude<Verdict, "CLEAR">` (see
 * types.ts) — a finding only exists when a marker found something worth
 * reporting, so "CLEAR" never appears as a per-finding verdict, only as the
 * aggregate when there's nothing to report.
 */
export function computeVerdict(findings: VerificationFinding[], markersRunCount: number): Verdict {
  if (markersRunCount === 0) return "INCONCLUSIVE";
  if (findings.some((f) => f.verdict === "FAIL")) return "FAIL";
  if (findings.some((f) => f.verdict === "REVIEW" || f.verdict === "INCONCLUSIVE")) return "REVIEW";
  return "CLEAR";
}
