import { describe, expect, it } from "vitest";
import { extractEnvelope, inspectEnvelope, verifyEnvelope } from "@/lib/api/envelope";
import type { PdfClassification, ProcessedDocument } from "@/lib/pdf/types";
import type { VerificationResult } from "@/lib/verification/types";

const classification: PdfClassification = {
  pdfType: "TextBased",
  pageCount: 3,
  pagesNeedingOcr: [],
  confidence: 0.92,
};

const document: ProcessedDocument = {
  source: "upload",
  filename: "statement.pdf",
  sizeBytes: 12345,
  pdfType: "TextBased",
  confidence: 0.92,
  pageCount: 3,
  processingTimeMs: 480,
  title: "April statement",
  hasEncodingIssues: false,
  isComplexLayout: false,
  pages: [{ page: 1, widthPt: 612, heightPt: 792, markdown: "hello", needsOcr: false, hasTable: true, hasColumns: false }],
  facts: [{ id: "fact-1", kind: "classification", page: 1, rect: null, label: "Document type", detail: "TEXTBASED" }],
};

const verification: VerificationResult = {
  verdict: "FAIL",
  findings: [
    {
      id: "f1",
      markerId: "BALANCE_BREAK",
      markerName: "Balance break",
      category: "Arithmetic",
      severity: "critical",
      verdict: "FAIL",
      evidence: { summary: "Balances don't reconcile", detail: "100 + 50 != 200", coordinates: [] },
    },
  ],
  markersRun: ["BALANCE_BREAK"],
  markersSkipped: [{ markerId: "DUPLICATE_TRANSACTION", reason: "No table detected." }],
  documentKind: "bank_statement",
};

describe("inspectEnvelope", () => {
  it("carries only classification — no document/facts/verdict, since /v1/inspect never extracts or verifies", () => {
    const env = inspectEnvelope(classification);
    expect(env.classification).toEqual({ pdfType: "TextBased", confidence: 0.92, pageCount: 3 });
    expect(env.document).toBeNull();
    expect(env.verdict).toBeNull();
    expect(env.findings).toEqual([]);
    expect(env.facts).toEqual([]);
    expect(env.processing).toBeNull();
  });
});

describe("extractEnvelope", () => {
  it("carries document/classification/facts/processing but no verdict, since /v1/extract never verifies", () => {
    const env = extractEnvelope(document, "bank_statement");
    expect(env.document).toEqual({ filename: "statement.pdf", sizeBytes: 12345, pageCount: 3, title: "April statement" });
    expect(env.classification.documentKind).toBe("bank_statement");
    expect(env.facts).toBe(document.facts);
    expect(env.verdict).toBeNull();
    expect(env.findings).toEqual([]);
    expect(env.processing).toEqual({ processingTimeMs: 480, pages: document.pages });
  });
});

describe("verifyEnvelope", () => {
  it("carries every field — the full pipeline ran", () => {
    const env = verifyEnvelope(document, verification);
    expect(env.verdict).toBe("FAIL");
    expect(env.findings).toBe(verification.findings);
    expect(env.classification.documentKind).toBe("bank_statement");
    expect(env.processing).toEqual({
      processingTimeMs: 480,
      markersRun: ["BALANCE_BREAK"],
      markersSkipped: verification.markersSkipped,
      pages: document.pages,
    });
  });
});
