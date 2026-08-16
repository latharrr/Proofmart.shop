import "server-only";

import { sanitizeFilename } from "@/lib/pdf/upload-safety";
import type { ProcessingErrorCode } from "@/lib/pdf/types";

const STATUS_BY_CODE: Record<ProcessingErrorCode, number> = {
  "invalid-file": 400,
  "too-large": 413,
  unsupported: 400,
  "password-protected": 422,
  unreadable: 422,
  "processing-failed": 500,
};

export function processingFailureStatus(code: ProcessingErrorCode): number {
  return STATUS_BY_CODE[code];
}

export async function readMultipartFile(request: Request): Promise<{ buffer: Buffer; filename: string; sizeBytes: number } | null> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return null;
  }
  const file = form.get("file");
  if (!(file instanceof File)) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, filename: sanitizeFilename(file.name), sizeBytes: buffer.byteLength };
}

/** Every /v1 response carries the same request ID in both the body and this header — same request, traceable either way. */
export function jsonError(requestId: string, status: number, code: string, message: string) {
  return Response.json({ error: { code, message }, requestId }, { status, headers: { "x-request-id": requestId } });
}

export function jsonOk(requestId: string, body: Record<string, unknown>) {
  return Response.json({ ...body, requestId }, { status: 200, headers: { "x-request-id": requestId } });
}
