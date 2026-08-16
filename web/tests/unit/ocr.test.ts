import { execFileSync } from "node:child_process";
import { PDFDocument } from "pdf-lib";
import { chromium } from "@playwright/test";
import { beforeAll, describe, expect, it } from "vitest";
import { extractPageImage } from "@/lib/ocr/extract-page-image";
import { TesseractCliOcrProcessor } from "@/lib/ocr/tesseract-cli-processor";
import { PDFProcessor } from "@/lib/pdf/extract";
import type { OCRProcessor, OCRTextItem } from "@/lib/pdf/types";
import { VerificationEngine } from "@/lib/verification/engine";
import { scannedPdf } from "../fixtures/build";

function tesseractAvailable(): boolean {
  try {
    execFileSync("tesseract", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Renders real text to a PNG via a real browser (already a project dependency for e2e), then embeds it as a page-covering image — a scanned document, structurally. */
async function scannedPdfWithText(lines: string[]): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 850, height: 300 } });
  const spans = lines.map((l, i) => `<div style="position:absolute;left:20px;top:${20 + i * 60}px;font:32px sans-serif;">${l}</div>`).join("");
  await page.setContent(`<div style="position:relative;width:850px;height:300px;background:white;">${spans}</div>`);
  const png = await page.screenshot();
  await browser.close();

  const doc = await PDFDocument.create();
  const image = await doc.embedPng(png);
  const pdfPage = doc.addPage([612, 792]);
  pdfPage.drawImage(image, { x: 0, y: 792 - 300, width: 850 * (612 / 850), height: 300 * (612 / 850) });
  return Buffer.from(await doc.save());
}

const hasTesseract = tesseractAvailable();
const describeIfTesseract = hasTesseract ? describe : describe.skip;

describe("extractPageImage", () => {
  it("returns null for a page with no embedded image (nothing to OCR)", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]);
    const buf = Buffer.from(await doc.save());
    expect(await extractPageImage(buf, 1)).toBeNull();
  });

  it("returns null for an out-of-range page instead of throwing", async () => {
    const buf = await scannedPdf();
    expect(await extractPageImage(buf, 99)).toBeNull();
  });

  it("extracts a real embedded image with its pixel and page-point dimensions", async () => {
    const buf = await scannedPdf();
    const image = await extractPageImage(buf, 1);
    expect(image).not.toBeNull();
    expect(image?.widthPx).toBe(850);
    expect(image?.heightPx).toBe(1100);
    expect(image?.pageWidthPt).toBe(612);
    expect(image?.pageHeightPt).toBe(792);
  });
});

// Real, local OCR — no API key, no network. Skipped automatically wherever
// the `tesseract` binary isn't on PATH (e.g. plain CI without the apt
// package, or Vercel's serverless runtime), rather than failing the suite
// or pretending to have run it.
describeIfTesseract("TesseractCliOcrProcessor (real OCR, requires system tesseract)", () => {
  let items: OCRTextItem[];

  beforeAll(async () => {
    const buf = await scannedPdfWithText(["BALANCE 91710.00", "Scanned Statement"]);
    items = await new TesseractCliOcrProcessor().recognize(buf, 1);
  }, 30_000);

  it("recognizes real rendered text", () => {
    const allText = items.map((i) => i.text).join(" ");
    expect(allText).toContain("BALANCE");
    expect(allText).toContain("91710.00");
  });

  it("reports a real, non-trivial confidence per word", () => {
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.confidence).toBeGreaterThan(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("produces coordinates within the page's real bounds", () => {
    for (const item of items) {
      expect(item.rect.x).toBeGreaterThanOrEqual(0);
      expect(item.rect.y).toBeGreaterThanOrEqual(0);
      expect(item.rect.x + item.rect.w).toBeLessThanOrEqual(612 + 1);
      expect(item.rect.y + item.rect.h).toBeLessThanOrEqual(792 + 1);
    }
  });

  it("merges into the document as ocr-text facts with page/coordinates/confidence, source-tagged distinctly from native text", async () => {
    const buf = await scannedPdfWithText(["Merged Text Check"]);
    const processor = new PDFProcessor(new TesseractCliOcrProcessor());
    const { document } = await processor.processWithEvidence(buf, { filename: "scan.pdf", sizeBytes: buf.length });

    const ocrFacts = document.facts.filter((f) => f.kind === "ocr-text");
    expect(ocrFacts.length).toBeGreaterThan(0);
    for (const fact of ocrFacts) {
      expect(fact.page).toBe(1);
      expect(fact.rect).not.toBeNull();
      expect(fact.label).toMatch(/% confidence/);
    }
    // Verification still runs on top — OCR facts don't replace or block it.
    const { raw } = await processor.processWithEvidence(buf, { filename: "scan.pdf", sizeBytes: buf.length });
    const verification = new VerificationEngine().run({ document, raw });
    expect(verification.markersRun).toContain("OCR_LOW_CONFIDENCE");
  });
});

describe("PDFProcessor without an OCRProcessor (default / Vercel-serverless shape)", () => {
  it("never attempts OCR and produces no ocr-text facts", async () => {
    const buf = await scannedPdf();
    const processor = new PDFProcessor(); // no OCR processor injected
    const { document } = await processor.processWithEvidence(buf, { filename: "scan.pdf", sizeBytes: buf.length });
    expect(document.facts.some((f) => f.kind === "ocr-text")).toBe(false);
  });
});

describe("PDFProcessor with a failing OCRProcessor", () => {
  it("degrades gracefully — no thrown error, no fabricated facts", async () => {
    const failing: OCRProcessor = {
      recognize: async () => {
        throw new Error("binary not found");
      },
    };
    const buf = await scannedPdf();
    const processor = new PDFProcessor(failing);
    const { document } = await processor.processWithEvidence(buf, { filename: "scan.pdf", sizeBytes: buf.length });
    expect(document.facts.some((f) => f.kind === "ocr-text")).toBe(false);
  });
});

describe("PDFProcessor with a deterministic fake OCRProcessor (pipeline-merge logic, no binary dependency)", () => {
  it("preserves page number, coordinates, and confidence, tagging results as ocr-text", async () => {
    const fake: OCRProcessor = {
      recognize: async () => [{ text: "FAKE OCR TEXT", confidence: 0.77, rect: { x: 10, y: 20, w: 100, h: 15 } }],
    };
    const buf = await scannedPdf();
    const processor = new PDFProcessor(fake);
    const { document } = await processor.processWithEvidence(buf, { filename: "scan.pdf", sizeBytes: buf.length });

    const ocrFacts = document.facts.filter((f) => f.kind === "ocr-text");
    expect(ocrFacts).toHaveLength(1);
    expect(ocrFacts[0]).toMatchObject({
      page: 1,
      rect: { x: 10, y: 20, w: 100, h: 15 },
      detail: "FAKE OCR TEXT",
    });
    expect(ocrFacts[0].label).toContain("77% confidence");
  });
});
