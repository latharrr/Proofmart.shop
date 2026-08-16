import { randomUUID } from "node:crypto";
import { authenticateApiRequest, recordUsageEvent } from "@/lib/api/auth";
import { inspectEnvelope } from "@/lib/api/envelope";
import { runInspect } from "@/lib/api/pipeline";
import { jsonError, jsonOk, processingFailureStatus, readMultipartFile } from "@/lib/api/route-helpers";
import { ProcessingFailure } from "@/lib/pdf/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /v1/inspect — classification only (PDF type, page count,
 * confidence). No text extraction, no OCR, no verification — the fastest
 * of the three /v1 operations. multipart/form-data, 'file' field.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return jsonError(requestId, auth.status, auth.code, auth.message);

  const input = await readMultipartFile(request);
  if (!input) return jsonError(requestId, 400, "invalid_request", "Expected multipart/form-data with a 'file' field.");

  try {
    const { classification } = await runInspect(input.buffer, input.sizeBytes);
    await recordUsageEvent({ apiKeyId: auth.apiKeyId, userId: auth.userId, eventType: "inspect_request" });
    return jsonOk(requestId, inspectEnvelope(classification));
  } catch (err) {
    if (err instanceof ProcessingFailure) return jsonError(requestId, processingFailureStatus(err.error.code), err.error.code, err.error.message);
    return jsonError(requestId, 500, "processing_failed", "Unexpected server error while inspecting the PDF.");
  }
}
