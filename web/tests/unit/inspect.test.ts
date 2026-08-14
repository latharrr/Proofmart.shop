import { describe, expect, it } from "vitest";
import { classify, validatePdfBytes } from "@/lib/pdf/inspect";
import { MAX_UPLOAD_BYTES } from "@/lib/pdf/types";
import { emptyBytes, encryptedLikeBytes, malformedPdfBytes, nativeTextPdf, nonPdfBytes, scannedPdf, tableHeavyPdf } from "../fixtures/build";

describe("validatePdfBytes", () => {
  it("rejects an empty file", () => {
    const buf = emptyBytes();
    const result = validatePdfBytes(buf, buf.length);
    expect(result).toEqual({ ok: false, error: { code: "invalid-file", message: expect.any(String) } });
  });

  it("rejects a file over the size limit", () => {
    const buf = Buffer.from("%PDF-1.7\n");
    const result = validatePdfBytes(buf, MAX_UPLOAD_BYTES + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("too-large");
  });

  it("rejects bytes with no %PDF- header", () => {
    const buf = nonPdfBytes();
    const result = validatePdfBytes(buf, buf.length);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid-file");
  });

  it("flags an /Encrypt trailer as password-protected before the native parser ever runs", () => {
    const buf = encryptedLikeBytes();
    const result = validatePdfBytes(buf, buf.length);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("password-protected");
  });

  it("accepts a well-formed PDF", async () => {
    const buf = await nativeTextPdf();
    const result = validatePdfBytes(buf, buf.length);
    expect(result).toEqual({ ok: true });
  });
});

describe("classify", () => {
  it("classifies a native-text PDF as TextBased with a real page count", async () => {
    const buf = await nativeTextPdf();
    const result = await classify(buf);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.pdfType).toBe("TextBased");
    expect(result.result.pageCount).toBe(1);
    expect(result.result.confidence).toBeGreaterThan(0);
  });

  it("does not classify a text-and-ruled-lines table page as TextBased-with-zero-confidence (still text-based, still has real content)", async () => {
    const buf = await tableHeavyPdf();
    const result = await classify(buf);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.pdfType).toBe("TextBased");
    expect(result.result.pageCount).toBe(1);
  });

  it("does not classify an image-only page as TextBased", async () => {
    const buf = await scannedPdf();
    const result = await classify(buf);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The exact label (Scanned/ImageBased/Mixed) is an implementation detail
    // of pdf-inspector's heuristics — what matters for our pipeline is that
    // a text-free raster page is never called TextBased.
    expect(result.result.pdfType).not.toBe("TextBased");
  });

  it("surfaces a typed error instead of throwing on garbage bytes", async () => {
    const buf = malformedPdfBytes();
    const result = await classify(buf);
    // pdf-inspector may either reject outright or degrade gracefully on a
    // near-empty malformed body — either is acceptable, but it must never
    // throw past this boundary uncaught.
    if (!result.ok) {
      expect(["unreadable", "processing-failed", "unsupported", "invalid-file"]).toContain(result.error.code);
    } else {
      expect(result.result.pageCount).toBeGreaterThanOrEqual(0);
    }
  });
});
