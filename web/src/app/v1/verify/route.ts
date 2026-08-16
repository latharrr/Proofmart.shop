import { randomUUID } from "node:crypto";
import { authenticateApiRequest, recordUsageEvent } from "@/lib/api/auth";
import { verifyEnvelope } from "@/lib/api/envelope";
import { runVerify } from "@/lib/api/pipeline";
import { jsonError, jsonOk, processingFailureStatus, readMultipartFile } from "@/lib/api/route-helpers";
import { ProcessingFailure } from "@/lib/pdf/types";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatch";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkUsageQuota } from "@/lib/billing/usage";
import { logRequest } from "@/lib/observability/log";

// @firecrawl/pdf-inspector is a native module — Node.js runtime only, same as /api/inspect.
export const runtime = "nodejs";
export const maxDuration = 60;

// An abuse guard, not a billing quota — generous on purpose. Per-plan quotas
// are Gate 9's concern (tracked separately via api_usage_events); this only
// stops a single key from hammering the most expensive endpoint.
const RATE_LIMIT = { windowSeconds: 60, limit: 60 };

/**
 * POST /v1/verify — the full pipeline: classify, extract, OCR where needed,
 * run every verification marker. multipart/form-data with a 'file' field,
 * same as curl -F "file=@doc.pdf". Requires Authorization: Bearer <api key>.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const start = Date.now();

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    logRequest({ requestId, route: "/v1/verify", method: "POST", status: auth.status, durationMs: Date.now() - start, failureCategory: auth.code });
    return jsonError(requestId, auth.status, auth.code, auth.message);
  }

  const allowed = await checkRateLimit(`v1:${auth.apiKeyId}`, RATE_LIMIT.windowSeconds, RATE_LIMIT.limit);
  if (!allowed) {
    logRequest({ requestId, route: "/v1/verify", method: "POST", status: 429, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "rate_limited" });
    return jsonError(requestId, 429, "rate_limited", `Too many requests. Limit: ${RATE_LIMIT.limit} per ${RATE_LIMIT.windowSeconds}s.`);
  }

  // Billing quota (plan-based, monthly) — distinct from the abuse rate
  // limit above, which applies regardless of plan.
  const quota = await checkUsageQuota(auth.userId);
  if (!quota.allowed) {
    logRequest({ requestId, route: "/v1/verify", method: "POST", status: 402, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "quota_exceeded" });
    return jsonError(requestId, 402, "quota_exceeded", `Monthly ${quota.plan} plan limit reached (${quota.used}/${quota.limit} /v1/verify calls). Upgrade at /account/billing.`);
  }

  const input = await readMultipartFile(request);
  if (!input) {
    logRequest({ requestId, route: "/v1/verify", method: "POST", status: 400, durationMs: Date.now() - start, apiKeyId: auth.apiKeyId, userId: auth.userId, failureCategory: "invalid_request" });
    return jsonError(requestId, 400, "invalid_request", "Expected multipart/form-data with a 'file' field.");
  }

  try {
    const { document, verification } = await runVerify(input.buffer, { filename: input.filename, sizeBytes: input.sizeBytes });
    await recordUsageEvent({ apiKeyId: auth.apiKeyId, userId: auth.userId, eventType: "verify_request" });
    const envelope = verifyEnvelope(document, verification);
    await dispatchWebhookEvent({ userId: auth.userId, eventType: "verification.completed", verificationId: requestId, result: envelope });
    logRequest({
      requestId,
      route: "/v1/verify",
      method: "POST",
      status: 200,
      durationMs: Date.now() - start,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      processingTimeMs: document.processingTimeMs,
      pageCount: document.pageCount,
    });
    return jsonOk(requestId, envelope);
  } catch (err) {
    const error =
      err instanceof ProcessingFailure ? err.error : ({ code: "processing-failed", message: "Unexpected server error while processing the PDF." } as const);
    await dispatchWebhookEvent({ userId: auth.userId, eventType: "verification.failed", verificationId: requestId, result: { error } });
    logRequest({
      requestId,
      route: "/v1/verify",
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
