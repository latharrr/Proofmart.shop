import { randomUUID } from "node:crypto";
import { authenticateApiRequest } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";
import type { DocumentRow } from "@/lib/documents";

export const runtime = "nodejs";

const RATE_LIMIT = { windowSeconds: 60, limit: 120 };

type DocumentMetadata = Pick<
  DocumentRow,
  "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "pdf_type" | "page_count" | "findings_count" | "error_code" | "error_message" | "created_at" | "updated_at"
>;

/**
 * GET /v1/documents/:id — metadata for one of the calling key's own saved
 * documents. Metadata only, same reasoning as the list route — the full
 * result payload is GET /v1/documents/:id/result. A document that exists
 * but belongs to a different account returns 404, not 403 — same
 * information a 403 would leak (that the id exists at all).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = randomUUID();
  const start = Date.now();
  const route = "/v1/documents/[id]";

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
    .select("id, filename, size_bytes, status, verdict, document_kind, pdf_type, page_count, findings_count, error_code, error_message, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle<DocumentMetadata>();

  if (!doc) {
    logRequest({ requestId, route, method: "GET", status: 404, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "not_found" });
    return jsonError(requestId, 404, "not_found", "No document with that id.");
  }

  logRequest({ requestId, route, method: "GET", status: 200, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId });
  return jsonOk(requestId, { document: doc });
}
