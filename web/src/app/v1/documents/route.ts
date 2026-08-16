import { randomUUID } from "node:crypto";
import { authenticateApiRequest } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";
import type { DocumentRow, DocumentStatus } from "@/lib/documents";
import type { Verdict } from "@/lib/verification/types";

export const runtime = "nodejs";

const RATE_LIMIT = { windowSeconds: 60, limit: 60 };
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUSES: readonly DocumentStatus[] = ["processing", "ready", "error"];
const VERDICTS: readonly Verdict[] = ["CLEAR", "REVIEW", "FAIL", "INCONCLUSIVE"];

type ListedDocument = Pick<
  DocumentRow,
  "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_code" | "error_message" | "created_at" | "updated_at"
>;

/**
 * GET /v1/documents — lists the calling key's own documents, newest first.
 * Metadata only (no `result` payload — see GET /v1/documents/:id/result for
 * that) so listing many documents stays cheap. Requires
 * Authorization: Bearer <api key>, same as every other /v1/* route.
 *
 * Query params: `status` (processing|ready|error), `verdict`
 * (CLEAR|REVIEW|FAIL|INCONCLUSIVE), `limit` (default 20, max 100), `before`
 * (ISO timestamp cursor — returns documents created strictly before this).
 * Unrecognized values are rejected with 400 rather than silently ignored.
 */
export async function GET(request: Request) {
  const requestId = randomUUID();
  const start = Date.now();
  const route = "/v1/documents";

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

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  if (statusParam && !STATUSES.includes(statusParam as DocumentStatus)) {
    return jsonError(requestId, 400, "invalid_request", `'status' must be one of: ${STATUSES.join(", ")}.`);
  }
  const verdictParam = url.searchParams.get("verdict");
  if (verdictParam && !VERDICTS.includes(verdictParam as Verdict)) {
    return jsonError(requestId, 400, "invalid_request", `'verdict' must be one of: ${VERDICTS.join(", ")}.`);
  }
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return jsonError(requestId, 400, "invalid_request", `'limit' must be an integer between 1 and ${MAX_LIMIT}.`);
  }
  const before = url.searchParams.get("before");
  if (before && Number.isNaN(Date.parse(before))) {
    return jsonError(requestId, 400, "invalid_request", "'before' must be a valid ISO 8601 timestamp.");
  }

  const supabase = createServiceClient();
  if (!supabase) {
    logRequest({ requestId, route, method: "GET", status: 503, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "service_unavailable" });
    return jsonError(requestId, 503, "service_unavailable", "Document storage is not configured.");
  }

  // Service-role client bypasses RLS entirely — .eq("user_id", ...) below is
  // the actual security boundary for this route, not defense in depth (see
  // lib/api/auth.ts's docstring: an API key has no user session for RLS to
  // key off of in the first place).
  let query = supabase
    .from("documents")
    .select("id, filename, size_bytes, status, verdict, document_kind, findings_count, error_code, error_message, created_at, updated_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (statusParam) query = query.eq("status", statusParam);
  if (verdictParam) query = query.eq("verdict", verdictParam);
  if (before) query = query.lt("created_at", new Date(before).toISOString());

  const { data, error } = await query.returns<ListedDocument[]>();
  if (error) {
    logRequest({ requestId, route, method: "GET", status: 500, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "query_failed" });
    return jsonError(requestId, 500, "internal_error", "Could not list documents.");
  }

  const documents = data ?? [];
  const nextCursor = documents.length === limit ? documents[documents.length - 1].created_at : null;

  logRequest({ requestId, route, method: "GET", status: 200, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId });
  return jsonOk(requestId, { documents, nextCursor });
}
