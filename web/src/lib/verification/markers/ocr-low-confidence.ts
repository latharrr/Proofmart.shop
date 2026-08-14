import type { Marker, MarkerOutcome } from "../types";

/**
 * OCR_LOW_CONFIDENCE
 *
 * Category:          Extraction
 * Required inputs:   `ProcessedPage.needsOcr` / `ocrReason` (from pdf-inspector's own classification — no OCR is actually run in Phase 2)
 * Detection logic:   Flags every page pdf-inspector itself flagged as needing OCR (unreliable/absent text layer).
 * Severity:          moderate
 * Verdict:           REVIEW — an unreadable page is a reason to look closer, not proof of anything wrong.
 * Evidence:          The page number and pdf-inspector's own reason string (when it provided one).
 * Coordinates:        Page-level only (no bounding box — the finding is "this whole page", not one location on it).
 * Limitations:        Reports pdf-inspector's own confidence signal; does not itself attempt OCR or verify the page's actual content.
 * False positives:    A page can be flagged for e.g. an unusual (but legitimate) font encoding, not only genuine scans — treat as "needs a human look", not "something is wrong".
 */
export const ocrLowConfidenceMarker: Marker = {
  id: "OCR_LOW_CONFIDENCE",
  name: "OCR needed",
  category: "Extraction",
  description: "Flags pages pdf-inspector classified as needing OCR — their text layer is unreliable or absent.",
  requiredInputs: ["ProcessedPage.needsOcr", "ProcessedPage.ocrReason"],
  limitations: [
    "Reports pdf-inspector's own classification signal; Phase 2 does not run OCR itself, so page content past this signal is unverified.",
    "A flagged page is not read — only marked as unreliable to extract from.",
  ],
  falsePositiveConsiderations: [
    "Unusual but legitimate font encodings can trigger this the same way a genuine scan does — it means 'look closer', not 'something is wrong'.",
  ],

  run(ctx): MarkerOutcome {
    const { pages } = ctx.document;
    if (pages.length === 0) return { status: "insufficient-data", reason: "Document has no pages." };

    const flagged = pages.filter((p) => p.needsOcr);
    const findings = flagged.map((p) => ({
      id: `finding-ocr-${p.page}`,
      markerId: "OCR_LOW_CONFIDENCE",
      markerName: "OCR needed",
      category: "Extraction" as const,
      severity: "moderate" as const,
      verdict: "REVIEW" as const,
      evidence: {
        summary: `Page ${p.page} needs OCR`,
        detail: p.ocrReason ? `Reason: ${p.ocrReason}` : "Text layer unreliable or absent on this page.",
        coordinates: [{ page: p.page, rect: null }],
      },
    }));

    return { status: "applicable", findings };
  },
};
