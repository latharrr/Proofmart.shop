import "server-only";

import { PDFProcessor } from "@/lib/pdf/extract";
import { TesseractJsOcrProcessor } from "@/lib/ocr";
import { validatePdfBytes, classify } from "@/lib/pdf/inspect";
import { ProcessingFailure, type PdfClassification, type ProcessedDocument } from "@/lib/pdf/types";
import { VerificationEngine } from "@/lib/verification/engine";
import { classifyDocumentKind, type DocumentKind } from "@/lib/verification/document-kind";
import type { VerificationResult } from "@/lib/verification/types";

/**
 * The three operations behind /v1/inspect, /v1/extract, /v1/verify — and
 * behind /api/inspect (the web UI's own route), which calls runVerify too.
 * One engine, three depths of the same pipeline, not three engines.
 */

/** Classification only — no extraction, no OCR, no verification. The lightest of the three. */
export async function runInspect(buffer: Buffer, sizeBytes: number): Promise<{ classification: PdfClassification }> {
  const validation = validatePdfBytes(buffer, sizeBytes);
  if (!validation.ok) throw new ProcessingFailure(validation.error);

  const result = await classify(buffer);
  if (!result.ok) throw new ProcessingFailure(result.error);

  return { classification: result.result };
}

/** Full extraction (with OCR) but no verification — same processor /v1/verify uses, one step short. */
export async function runExtract(buffer: Buffer, meta: { filename: string; sizeBytes: number }): Promise<{ document: ProcessedDocument; documentKind: DocumentKind }> {
  const processor = new PDFProcessor(new TesseractJsOcrProcessor());
  const { document } = await processor.processWithEvidence(buffer, meta);
  return { document, documentKind: classifyDocumentKind(document) };
}

/** The full pipeline — identical to what /api/inspect runs internally. */
export async function runVerify(buffer: Buffer, meta: { filename: string; sizeBytes: number }): Promise<{ document: ProcessedDocument; verification: VerificationResult }> {
  const processor = new PDFProcessor(new TesseractJsOcrProcessor());
  const { document, raw } = await processor.processWithEvidence(buffer, meta);
  const verification = new VerificationEngine().run({ document, raw });
  return { document, verification };
}
