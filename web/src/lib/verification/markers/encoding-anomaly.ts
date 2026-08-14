import type { Marker, MarkerOutcome } from "../types";

/**
 * ENCODING_ANOMALY
 *
 * Category:          Extraction
 * Required inputs:   `ProcessedDocument.hasEncodingIssues` (pdf-inspector's own encoding-quality signal)
 * Detection logic:   Fires once, document-wide, when pdf-inspector reports broken font encoding or CID mapping anywhere in the document.
 * Severity:          moderate
 * Verdict:           REVIEW — text that doesn't decode reliably deserves a second look, it isn't itself proof of tampering.
 * Evidence:          A document-level note; pdf-inspector doesn't localize which glyphs/runs are affected.
 * Coordinates:        None — document-level only.
 * Limitations:        Binary signal (present/absent) with no severity gradient or affected-page list from the underlying library.
 * False positives:    Some legitimately unusual (but valid) font subsets can trip this; it flags "worth checking", not "confirmed error".
 */
export const encodingAnomalyMarker: Marker = {
  id: "ENCODING_ANOMALY",
  name: "Encoding anomaly",
  category: "Extraction",
  description: "Flags documents where pdf-inspector detected broken font encoding or CID mapping.",
  requiredInputs: ["ProcessedDocument.hasEncodingIssues"],
  limitations: [
    "Document-level signal only — pdf-inspector does not report which page, run, or glyph is affected.",
    "Binary present/absent flag; no confidence score to weigh.",
  ],
  falsePositiveConsiderations: [
    "Some valid but unusual font subsets (e.g. certain CJK or symbol fonts) can trigger this without indicating anything wrong with the document.",
  ],

  run(ctx): MarkerOutcome {
    const { document } = ctx;
    if (typeof document.hasEncodingIssues !== "boolean") {
      return { status: "insufficient-data", reason: "Encoding status was not reported for this document." };
    }
    if (!document.hasEncodingIssues) {
      return { status: "applicable", findings: [] };
    }
    return {
      status: "applicable",
      findings: [
        {
          id: "finding-encoding-anomaly",
          markerId: "ENCODING_ANOMALY",
          markerName: "Encoding anomaly",
          category: "Extraction",
          severity: "moderate",
          verdict: "REVIEW",
          evidence: {
            summary: "Encoding anomaly detected",
            detail: "Some text in this document may not decode reliably — broken font encoding or CID mapping.",
            coordinates: [],
          },
        },
      ],
    };
  },
};
