import { describe, expect, it } from "vitest";
import { PDFProcessor } from "@/lib/pdf/extract";
import { ProcessingFailure } from "@/lib/pdf/types";
import {
  emptyBytes,
  encryptedLikeBytes,
  malformedPdfBytes,
  multiPagePdf,
  nativeTextPdf,
  nonPdfBytes,
  scannedPdf,
  tableHeavyPdf,
} from "../fixtures/build";

describe("PDFProcessor (end-to-end: validate -> classify -> extract -> normalize)", () => {
  it("processes a native-text PDF into a ready ProcessedDocument", async () => {
    const buf = await nativeTextPdf();
    const doc = await new PDFProcessor().process(buf, { filename: "report.pdf", sizeBytes: buf.length });
    expect(doc.source).toBe("upload");
    expect(doc.pdfType).toBe("TextBased");
    expect(doc.pageCount).toBe(1);
    expect(doc.pages).toHaveLength(1);
    expect(doc.facts.length).toBeGreaterThan(0);
    // Every fact must claim a page that actually exists in the document.
    for (const fact of doc.facts) {
      expect(fact.page).toBeGreaterThanOrEqual(1);
      expect(fact.page).toBeLessThanOrEqual(doc.pageCount);
    }
  });

  it("reports the real page count for a multi-page PDF and page-scopes its markdown", async () => {
    const buf = await multiPagePdf(5);
    const doc = await new PDFProcessor().process(buf, { filename: "multi.pdf", sizeBytes: buf.length });
    expect(doc.pageCount).toBe(5);
    expect(doc.pages).toHaveLength(5);
    expect(doc.pages.map((p) => p.page)).toEqual([1, 2, 3, 4, 5]);
  });

  it("flags a table on the table-heavy fixture", async () => {
    const buf = await tableHeavyPdf();
    const doc = await new PDFProcessor().process(buf, { filename: "ledger.pdf", sizeBytes: buf.length });
    const tableFact = doc.facts.find((f) => f.kind === "table");
    expect(tableFact).toBeDefined();
    expect(tableFact?.page).toBe(1);
  });

  it("never classifies an image-only scanned page as TextBased, and never invents forensic verdicts for it", async () => {
    const buf = await scannedPdf();
    const doc = await new PDFProcessor().process(buf, { filename: "scan.pdf", sizeBytes: buf.length });
    expect(doc.pdfType).not.toBe("TextBased");
    // Phase 1 draws no verification verdicts for uploads at all — that's
    // the rail's job (always INCONCLUSIVE), not the processor's.
    expect(doc).not.toHaveProperty("verdict");
  });

  it("rejects an empty file without touching the native parser", async () => {
    const buf = emptyBytes();
    await expect(new PDFProcessor().process(buf, { filename: "empty.pdf", sizeBytes: buf.length })).rejects.toMatchObject({
      error: { code: "invalid-file" },
    });
  });

  it("rejects a non-PDF file", async () => {
    const buf = nonPdfBytes();
    await expect(new PDFProcessor().process(buf, { filename: "notes.txt", sizeBytes: buf.length })).rejects.toMatchObject({
      error: { code: "invalid-file" },
    });
  });

  it("rejects a file carrying an /Encrypt trailer as password-protected", async () => {
    const buf = encryptedLikeBytes();
    await expect(new PDFProcessor().process(buf, { filename: "locked.pdf", sizeBytes: buf.length })).rejects.toMatchObject({
      error: { code: "password-protected" },
    });
  });

  it("fails predictably (never throws an untyped error) on a malformed PDF body", async () => {
    const buf = malformedPdfBytes();
    try {
      const doc = await new PDFProcessor().process(buf, { filename: "broken.pdf", sizeBytes: buf.length });
      // If the native parser is lenient enough to degrade gracefully, the
      // result must still be well-formed.
      expect(doc.pageCount).toBeGreaterThanOrEqual(0);
    } catch (err) {
      expect(err).toBeInstanceOf(ProcessingFailure);
      if (err instanceof ProcessingFailure) {
        expect(["unreadable", "processing-failed", "unsupported"]).toContain(err.error.code);
      }
    }
  });
});
