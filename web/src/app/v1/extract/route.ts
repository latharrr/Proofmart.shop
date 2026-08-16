import { randomUUID } from "node:crypto";
import { authenticateApiRequest, recordUsageEvent } from "@/lib/api/auth";
import { extractEnvelope } from "@/lib/api/envelope";
import { runExtract } from "@/lib/api/pipeline";
import { jsonError, jsonOk, processingFailureStatus, readMultipartFile } from "@/lib/api/route-helpers";
import { ProcessingFailure } from "@/lib/pdf/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /v1/extract — full extraction (positioned text, tables, links, OCR
 * on scanned pages) without verification. Same processor /v1/verify runs,
 * one step short of it. multipart/form-data, 'file' field.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return jsonError(requestId, auth.status, auth.code, auth.message);

  const input = await readMultipartFile(request);
  if (!input) return jsonError(requestId, 400, "invalid_request", "Expected multipart/form-data with a 'file' field.");

  try {
    const { document, documentKind } = await runExtract(input.buffer, { filename: input.filename, sizeBytes: input.sizeBytes });
    await recordUsageEvent({ apiKeyId: auth.apiKeyId, userId: auth.userId, eventType: "extract_request" });
    return jsonOk(requestId, extractEnvelope(document, documentKind));
  } catch (err) {
    if (err instanceof ProcessingFailure) return jsonError(requestId, processingFailureStatus(err.error.code), err.error.code, err.error.message);
    return jsonError(requestId, 500, "processing_failed", "Unexpected server error while extracting the PDF.");
  }
}
