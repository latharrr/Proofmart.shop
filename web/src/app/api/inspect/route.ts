import { del, get } from "@vercel/blob";
import { runVerify } from "@/lib/api/pipeline";
import type { ProcessingError, ProcessingErrorCode } from "@/lib/pdf/types";
import { ProcessingFailure } from "@/lib/pdf/types";
import { isTrustedBlobUrl, sanitizeFilename } from "@/lib/pdf/upload-safety";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { failedDocumentInsert, hashDocumentBytes, readyDocumentInsert } from "@/lib/documents";

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

  // Signed-in users get their result saved to "My documents" automatically
  // (see the `documents` table migration) — anonymous callers, and any
  // request served while Supabase itself isn't configured, keep today's
  // fully ephemeral behavior. isSupabaseConfigured() must be checked before
  // createClient() — createClient() throws synchronously without the env
  // vars it needs, and this route is the anonymous public demo's core path,
  // which has to keep working with zero Supabase config (see README).
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const claims = supabase ? (await supabase.auth.getClaims()).data?.claims : null;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  let persistedFile = false;
  try {
    // Same engine invocation /v1/verify runs (lib/api/pipeline.ts) — the
    // web UI and the public API are two callers of one pipeline, not two
    // pipelines. TesseractJsOcrProcessor bundles every asset it needs
    // (worker script, WASM core, English trained data — see
    // lib/ocr/tesseract-js.ts) and never fetches anything over the
    // network, so it works unmodified on Vercel's default Node.js
    // serverless runtime.
    const { document, verification } = await runVerify(buffer, { filename, sizeBytes: buffer.byteLength });

    if (userId && supabase) {
      // Only keep the blob when there's actually one to keep — a direct
      // (non-Blob) upload has nothing to persist a reference to, so the
      // saved document still records real findings, just with no stored
      // PDF to reopen or re-run against later.
      persistedFile = blobUrl !== null;
      await supabase.from("documents").insert({
        user_id: userId,
        ...readyDocumentInsert({
          filename,
          sizeBytes: buffer.byteLength,
          document,
          verification,
          storagePathname: persistedFile ? blobUrl : null,
          documentHash: hashDocumentBytes(buffer),
        }),
      });
    }

    return Response.json({ document, verification });
  } catch (err) {
    const error =
      err instanceof ProcessingFailure ? err.error : ({ code: "processing-failed", message: "Unexpected server error while processing the PDF." } as const);
    if (userId && supabase) {
      await supabase
        .from("documents")
        .insert({ user_id: userId, ...failedDocumentInsert({ filename, sizeBytes: buffer.byteLength, errorCode: error.code, errorMessage: error.message }) });
    }
    return errorResponse(error);
  } finally {
    // Best-effort cleanup — an upload that wasn't saved to a document
    // shouldn't linger in Blob storage (these can be real financial
    // documents). Never fails the request over a cleanup error.
    if (blobUrl && !persistedFile) void del(blobUrl).catch(() => {});
  }
}
