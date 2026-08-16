import * as fs from "node:fs";
import { chromium } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { TESSERACT_ASSET_PATHS, TesseractJsOcrProcessor } from "@/lib/ocr";
import { PDFProcessor } from "@/lib/pdf/extract";
import type { OCRProcessor } from "@/lib/pdf/types";
import { VerificationEngine } from "@/lib/verification/engine";
import { nativeTextPdf } from "../fixtures/build";

const PAGE = { width: 612, height: 792 };

/** Renders real text to a PNG via a real browser, for use as a page-covering scanned image — same technique used elsewhere in this suite for OCR fixtures. */
async function renderTextPng(lines: string[]): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 850, height: 300 } });
  const spans = lines.map((l, i) => `<div style="position:absolute;left:20px;top:${20 + i * 60}px;font:32px sans-serif;">${l}</div>`).join("");
  await page.setContent(`<div style="position:relative;width:850px;height:300px;background:white;">${spans}</div>`);
  const png = await page.screenshot();
  await browser.close();
  return png;
}

async function scannedPdfWithText(lines: string[]): Promise<Buffer> {
  const png = await renderTextPng(lines);
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(png);
  const pdfPage = doc.addPage([PAGE.width, PAGE.height]);
  pdfPage.drawImage(image, { x: 0, y: PAGE.height - 300, width: 850 * (PAGE.width / 850), height: 300 * (PAGE.width / 850) });
  return Buffer.from(await doc.save());
}

/** Page 1: real native text (should never reach OCR). Page 2: a real scanned image with real rendered text (should be the only page OCR'd). */
async function mixedPdf(): Promise<Buffer> {
  const png = await renderTextPng(["SCANNED PAGE TWO"]);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page1 = doc.addPage([PAGE.width, PAGE.height]);
  page1.drawText("Native text page one — not a scan.", { x: 72, y: 700, size: 14, font });

  const image = await doc.embedPng(png);
  const page2 = doc.addPage([PAGE.width, PAGE.height]);
  page2.drawImage(image, { x: 0, y: PAGE.height - 300, width: 850 * (PAGE.width / 850), height: 300 * (PAGE.width / 850) });

  return Buffer.from(await doc.save());
}

describe("no runtime CDN dependency (static assertion)", () => {
  it("every asset path is a real local file, never a URL", () => {
    for (const [name, value] of Object.entries(TESSERACT_ASSET_PATHS)) {
      expect(value, `${name} should not be a URL`).not.toMatch(/^https?:\/\//);
      expect(value, `${name} should not reference a known OCR CDN host`).not.toMatch(/jsdelivr|unpkg|tessdata\.projectnaptha\.com/i);
      expect(value.startsWith("/"), `${name} should be an absolute filesystem path`).toBe(true);
    }
    expect(fs.existsSync(TESSERACT_ASSET_PATHS.workerPath)).toBe(true);
    expect(fs.existsSync(TESSERACT_ASSET_PATHS.corePath)).toBe(true);
    expect(fs.existsSync(TESSERACT_ASSET_PATHS.langPath)).toBe(true);
  });

  it("the bundled English trained-data file is present in source control, not fetched", () => {
    const engData = `${TESSERACT_ASSET_PATHS.langPath}/eng.traineddata.gz`;
    expect(fs.existsSync(engData)).toBe(true);
    expect(fs.statSync(engData).size).toBeGreaterThan(1_000_000); // real trained data, not a stub
  });
});

describe("TesseractJsOcrProcessor (real OCR, bundled assets, no network)", () => {
  it("2. recognizes real rendered text on a scanned page", async () => {
    const buf = await scannedPdfWithText(["BALANCE 91710.00"]);
    const processor = new TesseractJsOcrProcessor();
    const items = await processor.recognize(buf, 1);
    await processor.terminate();
    const allText = items.map((i) => i.text).join(" ");
    expect(allText).toContain("BALANCE");
    expect(allText).toContain("91710.00");
  }, 60_000);

  it("4. every recognized word carries a coordinate rect within the page's real bounds", async () => {
    const buf = await scannedPdfWithText(["Coordinate Check"]);
    const processor = new TesseractJsOcrProcessor();
    const items = await processor.recognize(buf, 1);
    await processor.terminate();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.rect.x).toBeGreaterThanOrEqual(0);
      expect(item.rect.y).toBeGreaterThanOrEqual(0);
      expect(item.rect.x + item.rect.w).toBeLessThanOrEqual(PAGE.width + 1);
      expect(item.rect.y + item.rect.h).toBeLessThanOrEqual(PAGE.height + 1);
    }
  }, 60_000);

  it("5. every recognized word carries a real, non-trivial confidence in [0, 1]", async () => {
    const buf = await scannedPdfWithText(["Confidence Check"]);
    const processor = new TesseractJsOcrProcessor();
    const items = await processor.recognize(buf, 1);
    await processor.terminate();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.confidence).toBeGreaterThan(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    }
  }, 60_000);

  it("8. multiple pages reuse exactly one worker (not one per page)", async () => {
    const buf = await scannedPdfWithText(["Reuse Check Page"]);
    const processor = new TesseractJsOcrProcessor();
    const internals = processor as unknown as { getWorker(): Promise<unknown> };

    await processor.recognize(buf, 1); // first OCR call — spawns the worker
    const workerAfterFirstCall = await internals.getWorker();
    await processor.recognize(buf, 1); // second OCR call — should reuse it
    const workerAfterSecondCall = await internals.getWorker();

    expect(workerAfterSecondCall).toBe(workerAfterFirstCall); // same object — no new worker spawned
    await processor.terminate();
  }, 60_000);

  it("7. terminate() tears the worker down; a later call spawns a genuinely new one", async () => {
    const processor = new TesseractJsOcrProcessor() as unknown as {
      getWorker(): Promise<unknown>;
      terminate(): Promise<void>;
    };
    const before = await processor.getWorker();
    await processor.terminate();
    expect((processor as unknown as { worker: unknown }).worker).toBeNull();
    const after = await processor.getWorker();
    expect(after).not.toBe(before);
    await processor.terminate();
  }, 60_000);

  it("9. a missing local asset (bad langPath) fails clearly — rejects, never returns fabricated text", async () => {
    const buf = await scannedPdfWithText(["Should Not Recognize"]);
    const processor = new TesseractJsOcrProcessor({
      ...TESSERACT_ASSET_PATHS,
      langPath: "/nonexistent/path/that/does/not/exist",
    });
    await expect(processor.recognize(buf, 1)).rejects.toBeTruthy();
    await processor.terminate();
  }, 60_000);
});

describe("mixed PDF: OCR runs only on pages pdf-inspector flagged as needing it", () => {
  it("3. native page produces no ocr-text facts; scanned page does, with the real recognized text", async () => {
    const buf = await mixedPdf();
    const processor = new PDFProcessor(new TesseractJsOcrProcessor());
    const { document } = await processor.processWithEvidence(buf, { filename: "mixed.pdf", sizeBytes: buf.length });

    const ocrFactsByPage = new Map<number, typeof document.facts>();
    for (const fact of document.facts.filter((f) => f.kind === "ocr-text")) {
      ocrFactsByPage.set(fact.page, [...(ocrFactsByPage.get(fact.page) ?? []), fact]);
    }
    expect(ocrFactsByPage.has(1)).toBe(false); // native page — never OCR'd
    expect(ocrFactsByPage.get(2)?.length).toBeGreaterThan(0); // scanned page — OCR'd

    const page2Text = (ocrFactsByPage.get(2) ?? []).map((f) => f.detail).join(" ");
    expect(page2Text).toContain("SCANNED");
  }, 60_000);
});

describe("1. native-only PDF never invokes OCR", () => {
  it("zero pages flagged for OCR -> recognize() is never called", async () => {
    let calls = 0;
    const countingProcessor: OCRProcessor = {
      recognize: async (buffer, page) => {
        calls += 1;
        return new TesseractJsOcrProcessor().recognize(buffer, page);
      },
    };
    const buf = await nativeTextPdf();
    const processor = new PDFProcessor(countingProcessor);
    const { document } = await processor.processWithEvidence(buf, { filename: "native.pdf", sizeBytes: buf.length });
    expect(calls).toBe(0);
    expect(document.facts.some((f) => f.kind === "ocr-text")).toBe(false);
  });
});

describe("6. OCR failure (missing assets) returns a controlled result through the full pipeline", () => {
  it("degrades gracefully — no thrown error, no ocr-text facts, OCR_LOW_CONFIDENCE still fires", async () => {
    const buf = await scannedPdfWithText(["Should Not Appear"]);
    const brokenOcr = new TesseractJsOcrProcessor({ ...TESSERACT_ASSET_PATHS, langPath: "/nonexistent/path" });
    const processor = new PDFProcessor(brokenOcr);
    const { document, raw } = await processor.processWithEvidence(buf, { filename: "scan.pdf", sizeBytes: buf.length });
    expect(document.facts.some((f) => f.kind === "ocr-text")).toBe(false);

    const verification = new VerificationEngine().run({ document, raw });
    expect(verification.markersRun).toContain("OCR_LOW_CONFIDENCE");
  }, 60_000);
});
