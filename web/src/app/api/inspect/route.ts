import { PDFProcessor } from "@/lib/pdf/extract";
import type { ProcessingError, ProcessingErrorCode } from "@/lib/pdf/types";
import { ProcessingFailure } from "@/lib/pdf/types";
import { VerificationEngine } from "@/lib/verification/engine";

// @firecrawl/pdf-inspector is a native (napi-rs) module — it cannot run on
// the Edge runtime or in the browser, only in a Node.js server process.
export const runtime = "nodejs";
export const maxDuration = 60;

const STATUS_BY_CODE: Record<ProcessingErrorCode, number> = {
  "invalid-file": 400,
  "too-large": 413,
  "unsupported": 400,
  "password-protected": 422,
  "unreadable": 422,
  "processing-failed": 500,
};

function errorResponse(error: ProcessingError) {
  return Response.json({ error }, { status: STATUS_BY_CODE[error.code] });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse({ code: "invalid-file", message: "Expected a multipart/form-data upload." });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse({ code: "invalid-file", message: "No file provided under the 'file' field." });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const processor = new PDFProcessor();
    const { document, raw } = await processor.processWithEvidence(buffer, { filename: file.name, sizeBytes: buffer.byteLength });
    const verification = new VerificationEngine().run({ document, raw });
    return Response.json({ document, verification });
  } catch (err) {
    if (err instanceof ProcessingFailure) return errorResponse(err.error);
    return errorResponse({ code: "processing-failed", message: "Unexpected server error while processing the PDF." });
  }
}
