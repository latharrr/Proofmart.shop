import { del, get } from "@vercel/blob";
import { runVerify } from "@/lib/api/pipeline";
import type { ProcessingError, ProcessingErrorCode } from "@/lib/pdf/types";
import { ProcessingFailure } from "@/lib/pdf/types";
import { isTrustedBlobUrl, sanitizeFilename } from "@/lib/pdf/upload-safety";

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
  // A private blob's own URL 401s on a bare fetch — it requires the
  // server's real read-write credential (BLOB_READ_WRITE_TOKEN/OIDC),
  // which get() attaches automatically as a Bearer token. This is exactly
  // what makes the blob private: nothing without that credential, plain
  // URL knowledge included, can read it.
  const result = await get(blobUrl, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) {
    return errorResponse({ code: "unreadable", message: "Could not retrieve the uploaded file." });
  }
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
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
    // Same engine invocation /v1/verify runs (lib/api/pipeline.ts) — the
    // web UI and the public API are two callers of one pipeline, not two
    // pipelines. TesseractJsOcrProcessor bundles every asset it needs
    // (worker script, WASM core, English trained data — see
    // lib/ocr/tesseract-js.ts) and never fetches anything over the
    // network, so it works unmodified on Vercel's default Node.js
    // serverless runtime.
    const { document, verification } = await runVerify(buffer, { filename, sizeBytes: buffer.byteLength });
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
