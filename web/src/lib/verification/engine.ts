import "server-only";

import { classifyDocumentKind } from "./document-kind";
import { MARKER_REGISTRY } from "./registry";
import type { MarkerContext, VerificationResult } from "./types";
import { computeVerdict } from "./verdict";

const CONTENT_BEARING_CATEGORIES = new Set(["Arithmetic", "Semantic"]);

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

    const documentKind = classifyDocumentKind(ctx.document);
    let verdict = computeVerdict(findings, markersRun.length);

    // A "CLEAR" verdict means every marker that ran found nothing wrong —
    // but if only extraction-quality markers (OCR/encoding) ran, and no
    // content-bearing check (ledger arithmetic, date sequence) could even
    // attempt to run, "clear" overstates what was actually verified for an
    // unrecognized document type. Downgrade to INCONCLUSIVE instead of
    // implying a check that never happened.
    if (verdict === "CLEAR" && documentKind === "generic") {
      const ranContentBearing = markersRun.some((id) => {
        const marker = MARKER_REGISTRY.find((m) => m.id === id);
        return marker && CONTENT_BEARING_CATEGORIES.has(marker.category);
      });
      if (!ranContentBearing) verdict = "INCONCLUSIVE";
    }

    return { verdict, findings, markersRun, markersSkipped, documentKind };
  }
}
