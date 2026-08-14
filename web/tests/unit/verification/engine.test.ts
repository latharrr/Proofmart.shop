import { describe, expect, it } from "vitest";
import { PDFProcessor } from "@/lib/pdf/extract";
import { VerificationEngine } from "@/lib/verification/engine";
import {
  arithmeticInconsistencyPdf,
  cleanStatementPdf,
  crossPageTotalMismatchPdf,
  dateSequenceAnomalyPdf,
  duplicateTransactionPdf,
  nativeTextPdf,
  ocrLowConfidencePdf,
  tableWithoutLedgerHeadersPdf,
} from "../../fixtures/build";

async function verify(buf: Buffer, filename: string) {
  const { document, raw } = await new PDFProcessor().processWithEvidence(buf, { filename, sizeBytes: buf.length });
  return { document, result: new VerificationEngine().run({ document, raw }) };
}

describe("VerificationEngine end-to-end", () => {
  it("clean statement: BALANCE_BREAK runs and finds nothing, verdict CLEAR", async () => {
    const buf = await cleanStatementPdf();
    const { result } = await verify(buf, "clean.pdf");
    expect(result.markersRun).toContain("BALANCE_BREAK");
    expect(result.findings.filter((f) => f.markerId === "BALANCE_BREAK")).toHaveLength(0);
    expect(result.verdict).toBe("CLEAR");
  });

  it("arithmetic inconsistency: BALANCE_BREAK fires with real evidence and coordinates, verdict FAIL", async () => {
    const buf = await arithmeticInconsistencyPdf();
    const { result } = await verify(buf, "break.pdf");
    const finding = result.findings.find((f) => f.markerId === "BALANCE_BREAK");
    expect(finding).toBeDefined();
    expect(finding?.verdict).toBe("FAIL");
    expect(finding?.evidence.coordinates.length).toBeGreaterThan(0);
    expect(finding?.evidence.coordinates.every((c) => c.rect !== null)).toBe(true);
    expect(result.verdict).toBe("FAIL");
  });

  it("duplicate transaction: DUPLICATE_TRANSACTION fires, verdict REVIEW (no FAIL present)", async () => {
    const buf = await duplicateTransactionPdf();
    const { result } = await verify(buf, "dup.pdf");
    const finding = result.findings.find((f) => f.markerId === "DUPLICATE_TRANSACTION");
    expect(finding).toBeDefined();
    expect(finding?.verdict).toBe("REVIEW");
    expect(result.verdict).toBe("REVIEW");
  });

  it("a table with Date/Debit/Credit but no Balance column: BALANCE_BREAK reports insufficient-data rather than guessing at a missing column", async () => {
    const buf = await tableWithoutLedgerHeadersPdf();
    const { result } = await verify(buf, "table.pdf");
    const skippedIds = result.markersSkipped.map((s) => s.markerId);
    expect(skippedIds).toContain("BALANCE_BREAK");
    // DUPLICATE_TRANSACTION only needs Date + Debit/Credit, which this table
    // does have — it legitimately runs, but the fixture's filler cell text
    // ("R1C2") isn't a parseable amount, so it finds nothing to flag.
    expect(result.markersRun).toContain("DUPLICATE_TRANSACTION");
    expect(result.findings.filter((f) => f.markerId === "DUPLICATE_TRANSACTION")).toHaveLength(0);
  });

  it("a scanned page: OCR_LOW_CONFIDENCE fires, verdict REVIEW", async () => {
    const buf = await ocrLowConfidencePdf();
    const { result } = await verify(buf, "scan.pdf");
    const finding = result.findings.find((f) => f.markerId === "OCR_LOW_CONFIDENCE");
    expect(finding).toBeDefined();
    expect(result.verdict).toBe("REVIEW");
  });

  it("a simple text PDF with no table: OCR_LOW_CONFIDENCE and ENCODING_ANOMALY still run clean; arithmetic/semantic markers report insufficient-data; verdict INCONCLUSIVE overall (no content-bearing check could run, and the document doesn't match a supported kind)", async () => {
    const buf = await nativeTextPdf();
    const { result } = await verify(buf, "native.pdf");
    expect(result.markersRun).toContain("OCR_LOW_CONFIDENCE");
    expect(result.markersRun).toContain("ENCODING_ANOMALY");
    expect(result.markersSkipped.map((s) => s.markerId)).toContain("BALANCE_BREAK");
    expect(result.documentKind).toBe("generic");
    expect(result.verdict).toBe("INCONCLUSIVE");
  });

  it("date sequence anomaly: DATE_SEQUENCE_ANOMALY fires on an out-of-order row, verdict REVIEW", async () => {
    const buf = await dateSequenceAnomalyPdf();
    const { result } = await verify(buf, "dates.pdf");
    const finding = result.findings.find((f) => f.markerId === "DATE_SEQUENCE_ANOMALY");
    expect(finding).toBeDefined();
    expect(finding?.verdict).toBe("REVIEW");
    expect(result.verdict).toBe("REVIEW");
  });

  it("cross-page total mismatch: CROSS_PAGE_TOTAL_MISMATCH fires when page 2's opening balance doesn't carry forward from page 1's closing balance, verdict FAIL", async () => {
    const buf = await crossPageTotalMismatchPdf();
    const { result } = await verify(buf, "crosspage.pdf");
    const finding = result.findings.find((f) => f.markerId === "CROSS_PAGE_TOTAL_MISMATCH");
    expect(finding).toBeDefined();
    expect(finding?.verdict).toBe("FAIL");
    expect(finding?.evidence.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(finding?.evidence.coordinates.every((c) => c.rect !== null)).toBe(true);
    expect(result.verdict).toBe("FAIL");
  });

  it("bank statement keyword text classifies as bank_statement, not generic", async () => {
    const buf = await cleanStatementPdf();
    const { result } = await verify(buf, "clean.pdf");
    expect(result.documentKind).toBe("bank_statement");
  });
});
