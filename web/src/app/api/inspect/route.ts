import { randomUUID } from "node:crypto";
import { del, get } from "@vercel/blob";
import { runVerify } from "@/lib/api/pipeline";
import type { ProcessingError, ProcessingErrorCode } from "@/lib/pdf/types";
import { ProcessingFailure } from "@/lib/pdf/types";
import { isTrustedBlobUrl, sanitizeFilename } from "@/lib/pdf/upload-safety";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { failedDocumentInsert, hashDocumentBytes, readyDocumentInsert } from "@/lib/documents";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";
import { recordAuditEvent } from "@/lib/audit";

// @firecrawl/pdf-inspector is a native (napi-rs) module — it cannot run on
// the Edge runtime or in the browser, only in a Node.js server process.
export const runtime = "nodejs";
export const maxDuration = 60;

// This is the anonymous public demo's core path — the one endpoint anyone
// on the internet can hit with zero auth, running an expensive OCR/PDF
// pipeline each time. Anonymous callers get a tighter per-IP limit than a
// signed-in user gets per-account, since an IP is a much weaker identity to
// rely on but is what's actually available pre-auth.
const RATE_LIMIT_ANON = { windowSeconds: 600, limit: 10 };
const RATE_LIMIT_USER = { windowSeconds: 600, limit: 30 };

const STATUS_BY_CODE: Record<ProcessingErrorCode, number> = {
  "invalid-file": 400,
  "too-large": 413,
  "unsupported": 400,
  "password-protected": 422,
  "unreadable": 422,
  "processing-failed": 500,
};

function errorResponse(requestId: string, error: ProcessingError) {
  return Response.json({ error, requestId }, { status: STATUS_BY_CODE[error.code] });
}

async function readFromBlob(requestId: string, request: Request): Promise<{ buffer: Buffer; filename: string; blobUrl: string } | Response> {
  const body = await request.json().catch(() => null);
  const blobUrl = body?.blobUrl;
  if (typeof blobUrl !== "string" || !isTrustedBlobUrl(blobUrl)) {
    return errorResponse(requestId, { code: "invalid-file", message: "Missing or unrecognized upload reference." });
  }
  // A private blob's own URL 401s on a bare fetch — it requires the
  // server's real read-write credential (BLOB_READ_WRITE_TOKEN/OIDC),
  // which get() attaches automatically as a Bearer token. This is exactly
  // what makes the blob private: nothing without that credential, plain
  // URL knowledge included, can read it.
  const result = await get(blobUrl, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) {
    return errorResponse(requestId, { code: "unreadable", message: "Could not retrieve the uploaded file." });
  }
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
  const filename = typeof body?.filename === "string" ? sanitizeFilename(body.filename) : "upload.pdf";
  return { buffer, filename, blobUrl };
}

async function readFromFormData(requestId: string, request: Request): Promise<{ buffer: Buffer; filename: string; blobUrl: null } | Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(requestId, { code: "invalid-file", message: "Expected a multipart/form-data upload." });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse(requestId, { code: "invalid-file", message: "No file provided under the 'file' field." });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, filename: sanitizeFilename(file.name), blobUrl: null };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const start = Date.now();

  // Determined before touching the request body: it doesn't depend on it
  // (session comes from a cookie), and checking the rate limit first means
  // a rate-limited caller's upload is never parsed at all.
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const claims = supabase ? (await supabase.auth.getClaims()).data?.claims : null;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  const rateLimitKey = userId ? `inspect:user:${userId}` : `inspect:ip:${clientIp(request)}`;
  const rateLimitConfig = userId ? RATE_LIMIT_USER : RATE_LIMIT_ANON;
  const allowed = await checkRateLimit(rateLimitKey, rateLimitConfig.windowSeconds, rateLimitConfig.limit);
  if (!allowed) {
    logRequest({ requestId, route: "/api/inspect", method: "POST", status: 429, durationMs: Date.now() - start, userId: userId ?? undefined, failureCategory: "rate_limited" });
    return Response.json(
      { error: { code: "rate-limited", message: `Too many requests. Limit: ${rateLimitConfig.limit} per ${rateLimitConfig.windowSeconds}s.` }, requestId },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("application/json") ? await readFromBlob(requestId, request) : await readFromFormData(requestId, request);
  if (input instanceof Response) return input;

  const { buffer, filename, blobUrl } = input;

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
      await recordAuditEvent({ userId, eventType: "document_uploaded", metadata: { sizeBytes: buffer.byteLength, pageCount: document.pageCount } });
      await recordAuditEvent({ userId, eventType: "verification_completed", metadata: { verdict: verification.verdict, findingsCount: verification.findings.length } });
    }

    logRequest({
      requestId,
      route: "/api/inspect",
      method: "POST",
      status: 200,
      durationMs: Date.now() - start,
      userId: userId ?? undefined,
      processingTimeMs: document.processingTimeMs,
      pageCount: document.pageCount,
    });
    return Response.json({ document, verification, requestId });
  } catch (err) {
    const error =
      err instanceof ProcessingFailure ? err.error : ({ code: "processing-failed", message: "Unexpected server error while processing the PDF." } as const);
    if (userId && supabase) {
      await supabase
        .from("documents")
        .insert({ user_id: userId, ...failedDocumentInsert({ filename, sizeBytes: buffer.byteLength, errorCode: error.code, errorMessage: error.message }) });
      await recordAuditEvent({ userId, eventType: "document_uploaded", metadata: { sizeBytes: buffer.byteLength, failed: true, errorCode: error.code } });
    }
    logRequest({
      requestId,
      route: "/api/inspect",
      method: "POST",
      status: STATUS_BY_CODE[error.code],
      durationMs: Date.now() - start,
      userId: userId ?? undefined,
      failureCategory: error.code,
    });
    return errorResponse(requestId, error);
  } finally {
    // Best-effort cleanup — an upload that wasn't saved to a document
    // shouldn't linger in Blob storage (these can be real financial
    // documents). Never fails the request over a cleanup error.
    if (blobUrl && !persistedFile) void del(blobUrl).catch(() => {});
  }
}
