"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clampPage, firstPinnable, railFindingsForPage } from "@/lib/pdf/rail-adapter";
import { getPageDimensions, loadPdfDocument, renderPageToCanvas, type PageDimensions } from "@/lib/pdf/render";
import { MAX_UPLOAD_BYTES, type ProcessedDocument, type ProcessingError, type ProcessingStage } from "@/lib/pdf/types";
import type { VerificationResult } from "@/lib/verification/types";
import type { PDFDocumentProxy } from "pdfjs-dist";

const CANVAS_TARGET_WIDTH = 1400;

export interface FileMeta {
  name: string;
  size: number;
}

export interface LiveDocumentState {
  stage: ProcessingStage;
  error: ProcessingError | null;
  document: ProcessedDocument | null;
  verification: VerificationResult | null;
  fileMeta: FileMeta | null;
  page: number;
  pageDims: PageDimensions | null;
  loadFile: (file: File) => void;
  goToPage: (delta: number) => void;
  reset: () => void;
}

export interface UseLiveDocumentOptions {
  /** Called synchronously (from the triggering event handler, never from an effect) once a page's facts are known — lets the rail default-pin the first finding on that page, the same way the sample does. */
  onPageSettled?: (firstFactId: string | null) => void;
  /** Called when the live document is cleared and the rail reverts to the sample. */
  onReset?: () => void;
}

function validateFile(file: File): ProcessingError | null {
  const looksLikePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) return { code: "invalid-file", message: "Not a PDF file." };
  if (file.size === 0) return { code: "invalid-file", message: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { code: "too-large", message: `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 20 MB.` };
  }
  return null;
}

/**
 * Uploads directly to Vercel Blob and hands `/api/inspect` just the
 * resulting URL — this is what lets production uploads exceed the
 * platform's serverless request-body limit. Requires
 * `BLOB_READ_WRITE_TOKEN` to be configured (see README).
 */
async function submitViaBlob(file: File): Promise<Response> {
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/upload-token" });
  return fetch("/api/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url, filename: file.name }),
  });
}

function submitDirect(file: File): Promise<Response> {
  const form = new FormData();
  form.append("file", file);
  return fetch("/api/inspect", { method: "POST", body: form });
}

/**
 * Checks Blob availability first (a plain 200 either way — see
 * /api/upload-token's GET handler) rather than attempting the upload and
 * catching a failure: an HTTP error response gets logged to the console by
 * the browser itself regardless of whether application code handles it, so
 * every local-dev upload would otherwise log a spurious console error even
 * though the app degrades correctly. When Blob isn't configured (e.g. local
 * dev), this falls back to the direct-upload path that already worked
 * before Blob support existed — not a fake success.
 */
async function submitForInspection(file: File): Promise<Response> {
  try {
    const { available } = await fetch("/api/upload-token").then((r) => r.json());
    if (available) return await submitViaBlob(file);
  } catch {
    // Availability check itself failed — fall through to the direct path.
  }
  return submitDirect(file);
}

/** Best-effort mapping from pdf.js's own load-time exceptions to our error codes — a second, independent signal alongside the server's checks. */
function classifyPdfjsError(err: unknown): ProcessingError {
  const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : "";
  if (name === "PasswordException") {
    return { code: "password-protected", message: "This PDF is password-protected. Remove the password and try again." };
  }
  if (name === "InvalidPDFException") {
    return { code: "unreadable", message: "ProofMart couldn't read this PDF. The file may be corrupted or truncated." };
  }
  return { code: "processing-failed", message: "Processing failed unexpectedly. Try again or use a different file." };
}

/**
 * `canvasRef` is a parameter, not part of the returned state: mixing a ref
 * into a hook's returned object defeats the React Compiler's ability to
 * reason about which reads are render-safe, so the caller owns the ref and
 * attaches it to its own `<canvas>` element directly.
 */
export function useLiveDocument(canvasRef: React.RefObject<HTMLCanvasElement | null>, options: UseLiveDocumentOptions = {}): LiveDocumentState {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [error, setError] = useState<ProcessingError | null>(null);
  const [doc, setDoc] = useState<ProcessedDocument | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageDims, setPageDims] = useState<PageDimensions | null>(null);

  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const requestIdRef = useRef(0);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const reset = useCallback(() => {
    requestIdRef.current += 1; // invalidate any in-flight load
    pdfRef.current = null;
    setStage("idle");
    setError(null);
    setDoc(null);
    setVerification(null);
    setFileMeta(null);
    setPage(1);
    setPageDims(null);
    optionsRef.current.onReset?.();
  }, []);

  const loadFile = useCallback((file: File) => {
    const requestId = ++requestIdRef.current;
    setFileMeta({ name: file.name, size: file.size });
    const invalid = validateFile(file);
    if (invalid) {
      setStage("error");
      setError(invalid);
      setDoc(null);
      return;
    }

    void (async () => {
      try {
        setDoc(null);
        setVerification(null);
        setError(null);
        setStage("reading");
        const buf = await file.arrayBuffer();
        if (requestIdRef.current !== requestId) return;

        setStage("inspecting");
        const pdf = await loadPdfDocument(buf);
        if (requestIdRef.current !== requestId) return;
        pdfRef.current = pdf;

        setStage("extracting");
        const res = await submitForInspection(file);
        const payload = await res.json();
        if (requestIdRef.current !== requestId) return;

        if (!res.ok) {
          setStage("error");
          setError(payload.error as ProcessingError);
          return;
        }

        const processed = payload.document as ProcessedDocument;
        const verificationResult = payload.verification as VerificationResult;
        const dims = await getPageDimensions(pdf, 1);
        if (requestIdRef.current !== requestId) return;

        setDoc(processed);
        setVerification(verificationResult);
        setPage(1);
        setPageDims(dims);
        setStage("ready");
        optionsRef.current.onPageSettled?.(firstPinnable(railFindingsForPage(processed, verificationResult, 1))?.id ?? null);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setStage("error");
        setError(classifyPdfjsError(err));
      }
    })();
  }, []);

  const goToPage = useCallback(
    (delta: number) => {
      const total = pdfRef.current?.numPages ?? 1;
      const next = clampPage(page, total, delta);
      if (next === page) return;
      setPage(next);
      if (doc) optionsRef.current.onPageSettled?.(firstPinnable(railFindingsForPage(doc, verification, next))?.id ?? null);
    },
    [page, doc, verification],
  );

  // Render the current page whenever it changes or the canvas mounts.
  useEffect(() => {
    if (stage !== "ready" || !pdfRef.current || !canvasRef.current) return;
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    let cancelled = false;
    void (async () => {
      const dims = await renderPageToCanvas(pdf, page, canvas, CANVAS_TARGET_WIDTH);
      if (!cancelled) setPageDims(dims);
    })();
    return () => {
      cancelled = true;
    };
  }, [stage, page, canvasRef]);

  return { stage, error, document: doc, verification, fileMeta, page, pageDims, loadFile, goToPage, reset };
}
