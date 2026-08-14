import { del } from "@vercel/blob";
import { PDFProcessor } from "@/lib/pdf/extract";
import type { ProcessingError, ProcessingErrorCode } from "@/lib/pdf/types";
import { ProcessingFailure } from "@/lib/pdf/types";
import { isTrustedBlobUrl, sanitizeFilename } from "@/lib/pdf/upload-safety";
import { TesseractJsOcrProcessor } from "@/lib/ocr";
import { VerificationEngine } from "@/lib/verification/engine";

// @firecrawl/pdf-inspector is a native (napi-rs) module — it cannot run on
// the Edge runtime or in the browser, only in a Node.js server process.
export const runtime = "nodejs";
export const maxDuration = 60;

const STATUS_BY_CODE: Record<ProcessingErrorCode, number> = {
  "invalid-file": 400,
  "too-large": 413,
  "unsupported": 400,
  "password-protected": 422,
  "unreadable": 422,
  "processing-failed": 500,
};

function errorResponse(error: ProcessingError) {
  return Response.json({ error }, { status: STATUS_BY_CODE[error.code] });
}

async function readFromBlob(request: Request): Promise<{ buffer: Buffer; filename: string; blobUrl: string } | Response> {
  const body = await request.json().catch(() => null);
  const blobUrl = body?.blobUrl;
  if (typeof blobUrl !== "string" || !isTrustedBlobUrl(blobUrl)) {
    return errorResponse({ code: "invalid-file", message: "Missing or unrecognized upload reference." });
  }
  const res = await fetch(blobUrl);
  if (!res.ok) return errorResponse({ code: "unreadable", message: "Could not retrieve the uploaded file." });
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = typeof body?.filename === "string" ? sanitizeFilename(body.filename) : "upload.pdf";
  return { buffer, filename, blobUrl };
}

async function readFromFormData(request: Request): Promise<{ buffer: Buffer; filename: string; blobUrl: null } | Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse({ code: "invalid-file", message: "Expected a multipart/form-data upload." });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse({ code: "invalid-file", message: "No file provided under the 'file' field." });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, filename: sanitizeFilename(file.name), blobUrl: null };
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("application/json") ? await readFromBlob(request) : await readFromFormData(request);
  if (input instanceof Response) return input;

  const { buffer, filename, blobUrl } = input;

  try {
    // TesseractJsOcrProcessor bundles every asset it needs (worker script,
    // WASM core, English trained data — see lib/ocr/tesseract-js.ts) and
    // never fetches anything over the network, so it works unmodified on
    // Vercel's default Node.js serverless runtime. A fresh instance per
    // request means a fresh worker per processing job, torn down by
    // PDFProcessor.applyOcr's `finally` once every OCR-needing page in this
    // document is done — never throws out of PDFProcessor's OCR step
    // either way (see applyOcr's try/catch).
    const processor = new PDFProcessor(new TesseractJsOcrProcessor());
    const { document, raw } = await processor.processWithEvidence(buffer, { filename, sizeBytes: buffer.byteLength });
    const verification = new VerificationEngine().run({ document, raw });
    return Response.json({ document, verification });
  } catch (err) {
    if (err instanceof ProcessingFailure) return errorResponse(err.error);
    return errorResponse({ code: "processing-failed", message: "Unexpected server error while processing the PDF." });
  } finally {
    // Best-effort cleanup — a processed upload shouldn't linger in Blob
    // storage (these can be real financial documents). Never fails the
    // request over a cleanup error.
    if (blobUrl) void del(blobUrl).catch(() => {});
  }
}
