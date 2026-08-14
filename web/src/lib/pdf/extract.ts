import "server-only";

import {
  extractPagesMarkdown,
  extractTextWithPositions,
  processPdf,
  type PagesExtractionResult,
  type PdfResult,
  type TextItem,
} from "@firecrawl/pdf-inspector";
import { PDFDocument } from "pdf-lib";
import { classify, classifyProcessingError, validatePdfBytes } from "./inspect";
import { normalizeDocument } from "./normalize";
import { MAX_UPLOAD_PAGES, ProcessingFailure, type DocumentProcessor, type OCRProcessor, type ProcessedDocument } from "./types";

export interface RawExtraction {
  markdown: PagesExtractionResult;
  meta: PdfResult;
  textItems: TextItem[];
  /** 1-indexed page -> page size in PDF points. Needed to flip pdf-inspector's positioned-text/link coordinates (native bottom-left origin) into the rail's top-left convention — pdf-inspector never returns page dimensions itself. */
  pageSizes: Map<number, { widthPt: number; heightPt: number }>;
}

export const FALLBACK_PAGE_SIZE = { widthPt: 612, heightPt: 792 }; // US Letter

/**
 * Pulls every raw signal the normalization layer needs in one pass.
 *
 * pdf-inspector is pinned to 1.12.0 (see package.json) because 1.13.0+
 * ships native binaries requiring GLIBC_2.35, which Vercel's build/runtime
 * image doesn't provide — verified by reading the binaries' own ELF symbol
 * versions, and reproduced as a real deployment failure. 1.12.0's binary
 * tops out at GLIBC_2.34 and loads correctly there.
 *
 * Two consequences of that pin, both deliberate:
 *  - The `*Async` variants (added in 1.13.0) don't exist, so the sync calls
 *    are used directly. No practical loss: a serverless invocation handles
 *    one request at a time, so there's no other work to interleave with.
 *    This function stays `async` for `readPageSizes` (genuinely async) and
 *    to keep the signature stable for callers.
 *  - `extractStructureElements` (added in 1.14.0) doesn't exist, so tagged
 *    heading facts aren't produced. Nothing fabricates a replacement — see
 *    the note in `normalize.ts`.
 *
 * Page sizes come from pdf-lib, not pdf-inspector — pdf-inspector never
 * exposes page dimensions, only content bboxes.
 */
export async function extractContent(buffer: Buffer): Promise<RawExtraction> {
  const pageSizes = await readPageSizes(buffer);
  const markdown = extractPagesMarkdown(buffer);
  const meta = processPdf(buffer);
  const textItems = extractTextWithPositions(buffer);

  return { markdown, meta, textItems, pageSizes };
}

async function readPageSizes(buffer: Buffer): Promise<Map<number, { widthPt: number; heightPt: number }>> {
  const sizes = new Map<number, { widthPt: number; heightPt: number }>();
  try {
    const doc = await PDFDocument.load(buffer, { updateMetadata: false, ignoreEncryption: true });
    doc.getPages().forEach((page, i) => {
      const { width, height } = page.getSize();
      sizes.set(i + 1, { widthPt: width, heightPt: height });
    });
  } catch {
    // pdf-lib failed where pdf-inspector didn't (rare, given they agree on
    // "is this a PDF" almost always) — fall back to a standard page size
    // rather than losing the whole extraction over a geometry lookup.
  }
  return sizes;
}

// Re-exported so callers never need to import the native package directly.
export type { PagesExtractionResult, PdfResult, TextItem };

/**
 * The Phase 1 `DocumentProcessor`: validates, classifies, extracts, and
 * normalizes a PDF using `@firecrawl/pdf-inspector`. A future engine (or a
 * different upstream library) can implement the same interface without any
 * caller needing to change.
 */
export class PDFProcessor implements DocumentProcessor {
  /**
   * OCR is opt-in via constructor injection, not wired up by default — the
   * one real implementation (`TesseractCliOcrProcessor`) needs the system
   * `tesseract` binary, which Vercel's default serverless runtime doesn't
   * bundle. Callers that have it (self-hosted/Docker) pass it explicitly;
   * everyone else gets the same behavior as before OCR support existed.
   */
  constructor(private readonly ocr?: OCRProcessor) {}

  async process(buffer: Buffer, meta: { filename: string; sizeBytes: number }): Promise<ProcessedDocument> {
    const { document } = await this.processWithEvidence(buffer, meta);
    return document;
  }

  /**
   * Same pipeline as `process`, but also returns the raw extraction behind
   * the normalized document — the `VerificationEngine` needs real positioned
   * text (for evidence coordinates) that `ProcessedDocument` deliberately
   * doesn't carry forward, to keep that type a clean, presentation-ready
   * summary rather than a raw-data dump.
   */
  async processWithEvidence(buffer: Buffer, meta: { filename: string; sizeBytes: number }): Promise<{ document: ProcessedDocument; raw: RawExtraction }> {
    const validation = validatePdfBytes(buffer, meta.sizeBytes);
    if (!validation.ok) throw new ProcessingFailure(validation.error);

    const classification = await classify(buffer);
    if (!classification.ok) throw new ProcessingFailure(classification.error);
    if (classification.result.pageCount > MAX_UPLOAD_PAGES) {
      throw new ProcessingFailure({
        code: "too-large",
        message: `Document has ${classification.result.pageCount} pages — the limit is ${MAX_UPLOAD_PAGES}.`,
      });
    }

    let raw: RawExtraction;
    try {
      raw = await extractContent(buffer);
    } catch (err) {
      throw new ProcessingFailure(classifyProcessingError(err));
    }

    const document = normalizeDocument(raw, classification.result, meta);
    if (this.ocr) await this.applyOcr(document, buffer, classification.result.pagesNeedingOcr);
    return { document, raw };
  }

  /**
   * Runs OCR only on the pages pdf-inspector itself flagged as needing it,
   * merging results in as `ocr-text` facts (page, real coordinates, and
   * confidence all preserved) — clearly distinguished by `kind` from
   * `heading`/`link`/etc. facts, which come from the native text layer.
   * Never throws: a page that fails to OCR (unsupported image encoding,
   * asset/runtime unavailable) is simply skipped, leaving its existing
   * OCR_LOW_CONFIDENCE-derived fact as the only signal for that page —
   * no fabricated text, ever.
   *
   * One OCR processor instance is reused across every page in this loop
   * (a processor that owns a persistent resource, like a Tesseract.js
   * worker, only pays that setup cost once per document) and explicitly
   * `terminate()`d in `finally` once the whole job is done — whether every
   * page succeeded, some failed, or none needed OCR at all.
   */
  private async applyOcr(document: ProcessedDocument, buffer: Buffer, pagesNeedingOcr: number[]): Promise<void> {
    try {
      for (const zeroIndexedPage of pagesNeedingOcr) {
        const page = zeroIndexedPage + 1;
        try {
          const items = await this.ocr!.recognize(buffer, page);
          items.forEach((item, i) => {
            document.facts.push({
              id: `fact-ocr-text-${page}-${i}`,
              kind: "ocr-text",
              page,
              rect: item.rect,
              label: `OCR text · ${Math.round(item.confidence * 100)}% confidence`,
              detail: item.text,
            });
          });
        } catch (err) {
          // Asset/runtime unavailable, unsupported image encoding, etc. —
          // leave the page's OCR_LOW_CONFIDENCE fact as the only signal.
          // Logs the failure reason only (never document content/text) —
          // useful production observability for a silently-degraded page.
          console.error(`[OCR] recognize failed for page ${page}:`, err instanceof Error ? err.message : err);
        }
      }
    } finally {
      await this.ocr!.terminate?.().catch(() => {});
    }
  }
}
