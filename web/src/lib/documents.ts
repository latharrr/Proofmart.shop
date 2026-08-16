import "server-only";

import { createHash } from "node:crypto";
import type { ProcessedDocument } from "@/lib/pdf/types";
import type { VerificationResult, Verdict } from "@/lib/verification/types";
import { verifyEnvelope, type VerifyEnvelope } from "@/lib/api/envelope";
import { VERIFICATION_ENGINE_VERSION } from "@/lib/verification/version";

export type DocumentStatus = "processing" | "ready" | "error";

/** Matches the `documents` table (see the `create_documents_table` migration). `result` is exactly `/v1/verify`'s response envelope — one shape, reused rather than re-derived, so a saved document renders the same way a live one does. */
export interface DocumentRow {
  id: string;
  user_id: string;
  filename: string;
  size_bytes: number;
  status: DocumentStatus;
  verdict: Verdict | null;
  document_kind: string | null;
  pdf_type: string | null;
  page_count: number | null;
  findings_count: number;
  result: VerifyEnvelope | null;
  error_code: string | null;
  error_message: string | null;
  verification_version: string;
  storage_pathname: string | null;
  document_hash: string | null;
  created_at: string;
  updated_at: string;
}

/** sha256 of the exact bytes verified — the identity a dossier's signature actually vouches for (see lib/signing/sign.ts's SignedPayload.documentHash). Computed from the buffer already in hand at persistence time, never re-derived from a filename or DB reference. */
export function hashDocumentBytes(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Row fields for a document that finished processing — `storagePathname: null` means there's no PDF left to reopen or re-run (the caller chose not to keep one, e.g. an anonymous or non-Blob upload path). */
export function readyDocumentInsert(params: {
  filename: string;
  sizeBytes: number;
  document: ProcessedDocument;
  verification: VerificationResult;
  storagePathname: string | null;
  documentHash: string;
}) {
  return {
    filename: params.filename,
    size_bytes: params.sizeBytes,
    status: "ready" as const,
    verdict: params.verification.verdict,
    document_kind: params.verification.documentKind,
    pdf_type: params.document.pdfType,
    page_count: params.document.pageCount,
    findings_count: params.verification.findings.length,
    result: verifyEnvelope(params.document, params.verification),
    verification_version: VERIFICATION_ENGINE_VERSION,
    storage_pathname: params.storagePathname,
    document_hash: params.documentHash,
  };
}

/** Row fields for an upload that failed processing — kept as history (so a signed-in user can see what they tried and why it didn't work) but never with a stored file: reprocessing the same bytes would fail identically, so there's nothing a Re-run would accomplish. */
export function failedDocumentInsert(params: { filename: string; sizeBytes: number; errorCode: string; errorMessage: string }) {
  return {
    filename: params.filename,
    size_bytes: params.sizeBytes,
    status: "error" as const,
    error_code: params.errorCode,
    error_message: params.errorMessage,
    verification_version: VERIFICATION_ENGINE_VERSION,
    storage_pathname: null,
  };
}
