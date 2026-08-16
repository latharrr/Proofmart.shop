import "server-only";

import type { PdfClassification, ProcessedDocument } from "@/lib/pdf/types";
import type { DocumentKind } from "@/lib/verification/document-kind";
import type { VerificationResult } from "@/lib/verification/types";

/**
 * The public API's response shape: { document, classification, verdict,
 * findings, facts, processing }. Every field below is data the engine
 * already produced, only reshaped for this envelope — nothing here is
 * fabricated. Fields that don't apply at a given depth (e.g. /v1/inspect
 * never ran verification) are explicitly null/empty, never guessed at.
 */

export function inspectEnvelope(classification: PdfClassification) {
  return {
    document: null,
    classification: { pdfType: classification.pdfType, confidence: classification.confidence, pageCount: classification.pageCount },
    verdict: null,
    findings: [],
    facts: [],
    processing: null,
  };
}

export function extractEnvelope(document: ProcessedDocument, documentKind: DocumentKind) {
  return {
    document: { filename: document.filename, sizeBytes: document.sizeBytes, pageCount: document.pageCount, title: document.title },
    classification: {
      pdfType: document.pdfType,
      confidence: document.confidence,
      documentKind,
      hasEncodingIssues: document.hasEncodingIssues,
      isComplexLayout: document.isComplexLayout,
    },
    verdict: null,
    findings: [],
    facts: document.facts,
    processing: { processingTimeMs: document.processingTimeMs, pages: document.pages },
  };
}

export type VerifyEnvelope = ReturnType<typeof verifyEnvelope>;

export function verifyEnvelope(document: ProcessedDocument, verification: VerificationResult) {
  return {
    document: { filename: document.filename, sizeBytes: document.sizeBytes, pageCount: document.pageCount, title: document.title },
    classification: {
      pdfType: document.pdfType,
      confidence: document.confidence,
      documentKind: verification.documentKind,
      hasEncodingIssues: document.hasEncodingIssues,
      isComplexLayout: document.isComplexLayout,
    },
    verdict: verification.verdict,
    findings: verification.findings,
    facts: document.facts,
    processing: {
      processingTimeMs: document.processingTimeMs,
      markersRun: verification.markersRun,
      markersSkipped: verification.markersSkipped,
      pages: document.pages,
    },
  };
}
