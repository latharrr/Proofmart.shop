import { randomUUID } from "node:crypto";
import { authenticateApiRequest, recordUsageEvent } from "@/lib/api/auth";
import { inspectEnvelope } from "@/lib/api/envelope";
import { runInspect } from "@/lib/api/pipeline";
import { jsonError, jsonOk, processingFailureStatus, readMultipartFile } from "@/lib/api/route-helpers";
import { ProcessingFailure } from "@/lib/pdf/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";

export const runtime = "nodejs";
export const maxDuration = 30;

// Lightest of the three /v1 operations (classification only) — generous limit.
const RATE_LIMIT = { windowSeconds: 60, limit: 120 };

/**
 * POST /v1/inspect — classification only (PDF type, page count,
 * confidence). No text extraction, no OCR, no verification — the fastest
 * of the three /v1 operations. multipart/form-data, 'file' field.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const start = Date.now();

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    logRequest({ requestId, route: "/v1/inspect", method: "POST", status: auth.status, durationMs: Date.now() - start, failureCategory: auth.code });
    return jsonError(requestId, auth.status, auth.code, auth.message);
  }

  const allowed = await checkRateLimit(`v1:${auth.apiKeyId}`, RATE_LIMIT.windowSeconds, RATE_LIMIT.limit);
  if (!allowed) {
    logRequest({ requestId, route: "/v1/inspect", method: "POST", status: 429, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "rate_limited" });
    return jsonError(requestId, 429, "rate_limited", `Too many requests. Limit: ${RATE_LIMIT.limit} per ${RATE_LIMIT.windowSeconds}s.`);
  }

  const input = await readMultipartFile(request);
  if (!input) {
    logRequest({ requestId, route: "/v1/inspect", method: "POST", status: 400, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "invalid_request" });
    return jsonError(requestId, 400, "invalid_request", "Expected multipart/form-data with a 'file' field.");
  }

  try {
    const { classification } = await runInspect(input.buffer, input.sizeBytes);
    await recordUsageEvent({ apiKeyId: auth.apiKeyId, userId: auth.userId, eventType: "inspect_request" });
    logRequest({
      requestId,
      route: "/v1/inspect",
      method: "POST",
      status: 200,
      durationMs: Date.now() - start,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      pageCount: classification.pageCount,
    });
    return jsonOk(requestId, inspectEnvelope(classification));
  } catch (err) {
    const error =
      err instanceof ProcessingFailure ? err.error : ({ code: "processing-failed", message: "Unexpected server error while inspecting the PDF." } as const);
    logRequest({
      requestId,
      route: "/v1/inspect",
      method: "POST",
      status: processingFailureStatus(error.code),
      durationMs: Date.now() - start,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      failureCategory: error.code,
    });
    return jsonError(requestId, processingFailureStatus(error.code), error.code, error.message);
  }
}
