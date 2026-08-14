import "server-only";

import { MARKER_REGISTRY } from "./registry";
import type { MarkerContext, VerificationResult } from "./types";
import { computeVerdict } from "./verdict";

/**
 * Runs every registered marker against a document and computes the
 * deterministic aggregate verdict. Synchronous and pure given its inputs —
 * no network calls, no LLM, nothing non-deterministic.
 */
export class VerificationEngine {
  run(ctx: MarkerContext): VerificationResult {
    const markersRun: string[] = [];
    const markersSkipped: { markerId: string; reason: string }[] = [];
    const findings = [];

    for (const marker of MARKER_REGISTRY) {
      const outcome = marker.run(ctx);
      if (outcome.status === "applicable") {
        markersRun.push(marker.id);
        findings.push(...outcome.findings);
      } else {
        markersSkipped.push({ markerId: marker.id, reason: outcome.reason });
      }
    }

    const verdict = computeVerdict(findings, markersRun.length);
    return { verdict, findings, markersRun, markersSkipped };
  }
}
