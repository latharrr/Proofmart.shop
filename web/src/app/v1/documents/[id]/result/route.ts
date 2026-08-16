import { randomUUID } from "node:crypto";
import { authenticateApiRequest } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";
import type { DocumentRow } from "@/lib/documents";

export const runtime = "nodejs";

const RATE_LIMIT = { windowSeconds: 60, limit: 120 };

/**
 * GET /v1/documents/:id/result — the full /v1/verify-shaped result envelope
 * for a previously saved document, so a caller can fetch a result later
 * without re-uploading the file. 404 if the document doesn't exist or isn't
 * owned by the calling key's account; 409 if it exists but hasn't finished
 * processing (or failed) — there is no result to return yet, and returning
 * an empty/null envelope under 200 would look like a real (empty) result.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = randomUUID();
  const start = Date.now();
  const route = "/v1/documents/[id]/result";

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    logRequest({ requestId, route, method: "GET", status: auth.status, durationMs: Date.now() - start, failureCategory: auth.code });
    return jsonError(requestId, auth.status, auth.code, auth.message);
  }

  const allowed = await checkRateLimit(`v1:documents:${auth.apiKeyId}`, RATE_LIMIT.windowSeconds, RATE_LIMIT.limit);
  if (!allowed) {
    logRequest({ requestId, route, method: "GET", status: 429, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "rate_limited" });
    return jsonError(requestId, 429, "rate_limited", `Too many requests. Limit: ${RATE_LIMIT.limit} per ${RATE_LIMIT.windowSeconds}s.`);
  }

  const supabase = createServiceClient();
  if (!supabase) {
    logRequest({ requestId, route, method: "GET", status: 503, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "service_unavailable" });
    return jsonError(requestId, 503, "service_unavailable", "Document storage is not configured.");
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, status, result, error_code, error_message")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle<Pick<DocumentRow, "id" | "status" | "result" | "error_code" | "error_message">>();

  if (!doc) {
    logRequest({ requestId, route, method: "GET", status: 404, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "not_found" });
    return jsonError(requestId, 404, "not_found", "No document with that id.");
  }

  if (doc.status === "processing") {
    logRequest({ requestId, route, method: "GET", status: 409, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "not_ready" });
    return jsonError(requestId, 409, "not_ready", "This document is still processing.");
  }
  if (doc.status === "error" || !doc.result) {
    logRequest({ requestId, route, method: "GET", status: 409, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "processing_failed" });
    return jsonError(requestId, 409, doc.error_code ?? "processing_failed", doc.error_message ?? "This document has no result — processing failed.");
  }

  logRequest({ requestId, route, method: "GET", status: 200, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId });
  return jsonOk(requestId, doc.result);
}
