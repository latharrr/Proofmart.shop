import { randomUUID } from "node:crypto";
import { authenticateApiRequest, recordUsageEvent } from "@/lib/api/auth";
import { verifyEnvelope } from "@/lib/api/envelope";
import { runVerify } from "@/lib/api/pipeline";
import { jsonError, jsonOk, processingFailureStatus, readMultipartFile } from "@/lib/api/route-helpers";
import { ProcessingFailure } from "@/lib/pdf/types";

// @firecrawl/pdf-inspector is a native module — Node.js runtime only, same as /api/inspect.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /v1/verify — the full pipeline: classify, extract, OCR where needed,
 * run every verification marker. multipart/form-data with a 'file' field,
 * same as curl -F "file=@doc.pdf". Requires Authorization: Bearer <api key>.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return jsonError(requestId, auth.status, auth.code, auth.message);

  const input = await readMultipartFile(request);
  if (!input) return jsonError(requestId, 400, "invalid_request", "Expected multipart/form-data with a 'file' field.");

  try {
    const { document, verification } = await runVerify(input.buffer, { filename: input.filename, sizeBytes: input.sizeBytes });
    await recordUsageEvent({ apiKeyId: auth.apiKeyId, userId: auth.userId, eventType: "verify_request" });
    return jsonOk(requestId, verifyEnvelope(document, verification));
  } catch (err) {
    if (err instanceof ProcessingFailure) return jsonError(requestId, processingFailureStatus(err.error.code), err.error.code, err.error.message);
    return jsonError(requestId, 500, "processing_failed", "Unexpected server error while processing the PDF.");
  }
}
