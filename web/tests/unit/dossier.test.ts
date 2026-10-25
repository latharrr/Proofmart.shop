import { describe, expect, it } from "vitest";
import { generateDossierPdf } from "@/lib/dossier/generate-pdf";
import { MARKER_REGISTRY } from "@/lib/verification/registry";
import type { SignatureEnvelope } from "@/lib/signing/sign";
import type { VerifyEnvelope } from "@/lib/api/envelope";
import type { VerificationFinding } from "@/lib/verification/types";

/**
 * Regression: production dossier downloads returned HTTP 500 because the PDF
 * was drawn with pdf-lib's WinAnsi-only StandardFonts while ProofMart's own
 * marker text contains characters WinAnsi cannot encode (₹, −, ≈, ≠, …) —
 * pdf-lib threw inside widthOfTextAtSize. The dossier now embeds Unicode
 * TTFs; these tests pin rendering against the exact text that killed it.
 */

const UNICODE_FINDING: VerificationFinding = {
  id: "f-unicode",
  markerId: "BALANCE_BREAK",
  markerName: "Balance break",
  category: "Arithmetic",
  severity: "critical",
  verdict: "FAIL",
  evidence: {
    summary: "Running balance differs from prior + credit − debit by ₹5,000.00.",
    detail: "84,210.00 + 12,500.00 = 96,710.00 ≠ 91,710.00 · confidence ≈ 1.00 — re-add the column",
    coordinates: [{ page: 1, rect: { x: 500, y: 161, w: 36, h: 9 } }],
  },
};

function envelope(overrides: Partial<VerifyEnvelope> = {}): VerifyEnvelope {
  return {
    document: { filename: "statement.pdf", sizeBytes: 1677, pageCount: 1, title: null },
    classification: { pdfType: "TextBased", confidence: 1, documentKind: "bank_statement", hasEncodingIssues: false, isComplexLayout: true },
    verdict: "FAIL",
    findings: [UNICODE_FINDING],
    facts: [],
    processing: {
      processingTimeMs: 12,
      // Every registered marker runs, so every registered description and
      // limitations string renders — this is what pulls ProofMart's real
      // marker copy (the actual source of the U+2212 etc.) into the PDF.
      markersRun: MARKER_REGISTRY.map((m) => m.id),
      markersSkipped: [],
      pages: [],
    },
    ...overrides,
  } as VerifyEnvelope;
}

function signature(): SignatureEnvelope {
  return {
    payload: {
      verificationId: "11111111-1111-1111-1111-111111111111",
      documentIdentifier: "22222222-2222-2222-2222-222222222222",
      engineVersion: "1",
      timestamp: "2026-10-25T00:00:00.000Z",
      documentHash: "a".repeat(64),
      verdict: "FAIL",
      findings: [UNICODE_FINDING],
    },
    signature: "AAAA",
    algorithm: "ed25519",
    keyId: "testkey",
  };
}

describe("generateDossierPdf", () => {
  it("renders findings and marker copy containing non-WinAnsi characters without throwing", async () => {
    const bytes = await generateDossierPdf({ filename: "statement.pdf", envelope: envelope(), signature: signature() });
    expect(bytes.length).toBeGreaterThan(4000);
    expect(Buffer.from(bytes.slice(0, 5)).toString("latin1")).toBe("%PDF-");
  });

  it("renders a CLEAR envelope with zero findings", async () => {
    const e = envelope({ verdict: "CLEAR", findings: [] });
    const sig = signature();
    sig.payload = { ...sig.payload, verdict: "CLEAR", findings: [] };
    const bytes = await generateDossierPdf({ filename: "clean.pdf", envelope: e, signature: sig });
    expect(Buffer.from(bytes.slice(0, 5)).toString("latin1")).toBe("%PDF-");
  });

  it("never throws on user-controlled filenames outside the embedded fonts' coverage", async () => {
    // Devanagari is not covered by Libre Franklin / JetBrains Mono: the
    // sanitizer must substitute, not throw, whatever the document is called.
    const bytes = await generateDossierPdf({ filename: "बैंक विवरण ₹ — final (2).pdf", envelope: envelope(), signature: signature() });
    expect(Buffer.from(bytes.slice(0, 5)).toString("latin1")).toBe("%PDF-");
  });
});
