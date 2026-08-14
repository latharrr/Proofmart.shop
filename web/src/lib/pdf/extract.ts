import "server-only";

import {
  extractPagesMarkdownAsync,
  extractStructureElements,
  extractTextWithPositions,
  processPdfAsync,
  type PagesExtractionResult,
  type PdfResult,
  type StructureElementJs,
  type TextItem,
} from "@firecrawl/pdf-inspector";
import { PDFDocument } from "pdf-lib";
import { classify, classifyProcessingError, validatePdfBytes } from "./inspect";
import { normalizeDocument } from "./normalize";
import { ProcessingFailure, type DocumentProcessor, type ProcessedDocument } from "./types";

export interface RawExtraction {
  markdown: PagesExtractionResult;
  meta: PdfResult;
  textItems: TextItem[];
  structureElements: StructureElementJs[];
  /** 1-indexed page -> page size in PDF points. Needed to flip pdf-inspector's positioned-text/link coordinates (native bottom-left origin) into the rail's top-left convention — pdf-inspector never returns page dimensions itself. */
  pageSizes: Map<number, { widthPt: number; heightPt: number }>;
}

export const FALLBACK_PAGE_SIZE = { widthPt: 612, heightPt: 792 }; // US Letter

/**
 * Pulls every raw signal the normalization layer needs in one pass.
 * `extractStructureElements` has no async variant in this version of the
 * library, so it runs synchronously alongside the awaited calls — cheap
 * relative to markdown/position extraction on realistic documents.
 *
 * Page sizes come from pdf-lib, not pdf-inspector — pdf-inspector never
 * exposes page dimensions, only content bboxes.
 */
export async function extractContent(buffer: Buffer): Promise<RawExtraction> {
  const [markdown, meta, pageSizes] = await Promise.all([
    extractPagesMarkdownAsync(buffer),
    processPdfAsync(buffer),
    readPageSizes(buffer),
  ]);
  const textItems = extractTextWithPositions(buffer);
  const structureElements = extractStructureElements(buffer);

  return { markdown, meta, textItems, structureElements, pageSizes };
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
export type { PagesExtractionResult, PdfResult, StructureElementJs, TextItem };

/**
 * The Phase 1 `DocumentProcessor`: validates, classifies, extracts, and
 * normalizes a PDF using `@firecrawl/pdf-inspector`. A future engine (or a
 * different upstream library) can implement the same interface without any
 * caller needing to change.
 */
export class PDFProcessor implements DocumentProcessor {
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

    let raw: RawExtraction;
    try {
      raw = await extractContent(buffer);
    } catch (err) {
      throw new ProcessingFailure(classifyProcessingError(err));
    }

    const document = normalizeDocument(raw, classification.result, meta);
    return { document, raw };
  }
}
