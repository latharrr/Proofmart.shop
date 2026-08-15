/**
 * Shared types for the document-processing pipeline.
 *
 * These are the app's own DTOs — deliberately decoupled from
 * `@firecrawl/pdf-inspector`'s types so the native module never has to be
 * importable from client code (it can't run in the browser at all).
 */

// ---------------------------------------------------------------------------
// Classification / raw facts
// ---------------------------------------------------------------------------

export type PdfType = "TextBased" | "Scanned" | "ImageBased" | "Mixed";

export interface PdfClassification {
  pdfType: PdfType;
  pageCount: number;
  /** 0-indexed pages that need OCR. */
  pagesNeedingOcr: number[];
  confidence: number;
}

/** A rectangle in PDF points, top-left origin. pdf-inspector itself returns bottom-left-origin coordinates; `normalizeDocument`/`toRailRect` flip every rect into this convention before it reaches app code, so nothing downstream of extraction needs to know about the native PDF space. */
export interface PdfRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FactKind =
  | "classification"
  | "title"
  | "encoding-issue"
  | "ocr-needed"
  | "table"
  | "heading"
  | "link"
  | "form-field"
  | "ocr-text";

/**
 * A fact genuinely extracted from the document by pdf-inspector — never a
 * forensic judgement. `rect` is present only when the fact is anchored to a
 * specific location on the page; document- and page-level facts omit it.
 */
export interface ExtractedFact {
  id: string;
  kind: FactKind;
  /** 1-indexed page this fact belongs to. */
  page: number;
  rect: PdfRect | null;
  label: string;
  detail: string;
}

export interface ProcessedPage {
  /** 1-indexed page number. */
  page: number;
  widthPt: number;
  heightPt: number;
  markdown: string;
  needsOcr: boolean;
  ocrReason?: string;
  hasTable: boolean;
  hasColumns: boolean;
}

export interface ProcessedDocument {
  source: "upload";
  filename: string;
  sizeBytes: number;
  pdfType: PdfType;
  confidence: number;
  pageCount: number;
  processingTimeMs: number;
  title: string | null;
  hasEncodingIssues: boolean;
  isComplexLayout: boolean;
  pages: ProcessedPage[];
  facts: ExtractedFact[];
}

// ---------------------------------------------------------------------------
// Processing state machine (client-side)
// ---------------------------------------------------------------------------

export type ProcessingStage = "idle" | "reading" | "inspecting" | "extracting" | "ready" | "error";

/** Matches the "up to 50 pages, 20 MB" limit already stated in the marketing copy's RUN section. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_PAGES = 50;

export type ProcessingErrorCode =
  | "invalid-file"
  | "too-large"
  | "password-protected"
  | "unreadable"
  | "unsupported"
  | "processing-failed";

export interface ProcessingError {
  code: ProcessingErrorCode;
  message: string;
}

// ---------------------------------------------------------------------------
// Evidence Rail contract — what the rail actually renders, regardless of
// whether the data came from the bundled sample or a real upload.
// ---------------------------------------------------------------------------

export type RailVerdict = "FAIL" | "REVIEW" | "CLEAR" | "INCONCLUSIVE";

/** One row in the rail's findings panel — a verification finding (sample) or an extracted fact (live), normalized to the same shape. */
export interface RailFinding {
  id: string;
  verdict: RailVerdict;
  marker: string;
  addr1: string;
  addr2: string;
  explanation: string;
  arithmetic: string | null;
  rect: PdfRect | null;
  /** Distinguishes an unverified extracted fact from an actual forensic verification finding. */
  origin: "extracted-fact" | "verification-finding";
}

export interface RailDocument {
  filename: string;
  sizeBytes: number;
  page: number;
  pageCount: number;
  pageWidthPt: number;
  pageHeightPt: number;
  verdict: RailVerdict;
}

// ---------------------------------------------------------------------------
// Processing abstraction — lets a real OCR/verification engine be plugged
// in later without touching the rail or the upload flow.
// ---------------------------------------------------------------------------

export interface DocumentProcessor {
  process(buffer: Buffer, meta: { filename: string; sizeBytes: number }): Promise<ProcessedDocument>;
}

export interface OCRTextItem {
  text: string;
  /** Rail-space rect (top-left origin, PDF points) — already mapped from the OCR engine's own pixel space. */
  rect: PdfRect;
  /** 0-1, as reported by the OCR engine. */
  confidence: number;
}

/**
 * Recognizes text on one OCR-needed page. `buffer` is the whole PDF's
 * bytes — the implementation is responsible for extracting/rasterizing
 * that one page's image content itself. See `lib/ocr/tesseract-js.ts` for
 * the production implementation (bundled Tesseract.js, no CDN, no system
 * binary) and `lib/ocr/tesseract-cli-processor.ts` for a self-hosted
 * alternative that shells out to the system `tesseract` binary.
 */
export interface OCRProcessor {
  recognize(buffer: Buffer, page: number): Promise<OCRTextItem[]>;
  /**
   * Optional lifecycle hook, called once after every OCR-needing page in a
   * single processing job has been recognized (whether or not any of them
   * failed) — lets a processor that owns an expensive persistent resource
   * (e.g. a Tesseract.js worker thread) release it exactly once per job
   * rather than per page. Processors with no such resource can omit it.
   */
  terminate?(): Promise<void>;
}

// The Phase 1 placeholder `VerificationEngine` interface that used to live
// here has been superseded by the real thing: `Marker` / `VerificationEngine`
// / `VerificationResult` in `lib/verification/types.ts` and `engine.ts`.

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented yet`);
    this.name = "NotImplementedError";
  }
}

/** Thrown by a `DocumentProcessor` when processing can't complete — carries a typed, user-facing error. */
export class ProcessingFailure extends Error {
  readonly error: ProcessingError;
  constructor(error: ProcessingError) {
    super(error.message);
    this.name = "ProcessingFailure";
    this.error = error;
  }
}
