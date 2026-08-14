import "server-only";

import { classifyPdfAsync } from "@firecrawl/pdf-inspector";
import { MAX_UPLOAD_BYTES, type PdfClassification, type ProcessingError } from "./types";

/**
 * Validation errors are returned, not thrown — callers (the API route) need
 * a typed result they can turn straight into a response, not a try/catch
 * around a native module.
 */
export type ValidationResult = { ok: true } | { ok: false; error: ProcessingError };

const PDF_MAGIC = "%PDF-";
/** Readers tolerate junk before the header; search only the first KB, matching common PDF-reader leniency. */
const MAGIC_SEARCH_WINDOW = 1024;

export function validatePdfBytes(buffer: Buffer, sizeBytes: number): ValidationResult {
  if (sizeBytes === 0) {
    return { ok: false, error: { code: "invalid-file", message: "The file is empty." } };
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: { code: "too-large", message: `File is ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB — the limit is 20 MB.` },
    };
  }

  const header = buffer.subarray(0, MAGIC_SEARCH_WINDOW).toString("latin1");
  if (!header.includes(PDF_MAGIC)) {
    return { ok: false, error: { code: "invalid-file", message: "Not a PDF — no %PDF- header found." } };
  }

  if (looksEncrypted(buffer)) {
    return {
      ok: false,
      error: { code: "password-protected", message: "This PDF is password-protected. Remove the password and try again." },
    };
  }

  return { ok: true };
}

/**
 * Heuristic pre-check: encrypted PDFs carry an `/Encrypt` reference in the
 * trailer dictionary. This can't distinguish owner- from user-password
 * encryption, but both block text extraction the same way, so either is
 * worth surfacing before the native parser hits it.
 */
function looksEncrypted(buffer: Buffer): boolean {
  // The trailer is conventionally near the end of the file; search the last
  // 4KB first (cheap, catches the common case) before falling back to a
  // full scan for PDFs with an unusual layout.
  const tailWindow = buffer.subarray(Math.max(0, buffer.length - 4096));
  if (tailWindow.toString("latin1").includes("/Encrypt")) return true;
  return buffer.toString("latin1").includes("/Encrypt");
}

export async function classify(buffer: Buffer): Promise<{ ok: true; result: PdfClassification } | { ok: false; error: ProcessingError }> {
  try {
    const raw = await classifyPdfAsync(buffer);
    return {
      ok: true,
      result: {
        pdfType: raw.pdfType as PdfClassification["pdfType"],
        pageCount: raw.pageCount,
        pagesNeedingOcr: raw.pagesNeedingOcr,
        confidence: raw.confidence,
      },
    };
  } catch (err) {
    return { ok: false, error: classifyProcessingError(err) };
  }
}

/**
 * pdf-inspector throws plain `Error`s from the native layer (napi-rs
 * surfaces Rust panics/errors as JS exceptions). There's no structured error
 * code, so we pattern-match the message — best-effort, defaults to a
 * generic processing failure when the cause is unclear.
 */
export function classifyProcessingError(err: unknown): ProcessingError {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes("encrypt") || lower.includes("password")) {
    return { code: "password-protected", message: "This PDF is password-protected. Remove the password and try again." };
  }
  if (lower.includes("unsupported") || lower.includes("not supported")) {
    return { code: "unsupported", message: "This PDF uses a feature ProofMart doesn't support yet." };
  }
  if (lower.includes("parse") || lower.includes("invalid") || lower.includes("malformed") || lower.includes("corrupt") || lower.includes("eof")) {
    return { code: "unreadable", message: "ProofMart couldn't read this PDF — the file may be corrupted or truncated." };
  }
  return { code: "processing-failed", message: "Processing failed unexpectedly. Try again or use a different file." };
}
