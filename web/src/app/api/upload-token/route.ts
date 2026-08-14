import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/pdf/types";

// Generates short-lived client tokens for direct browser -> Vercel Blob
// uploads, bypassing the platform's serverless request-body limit for large
// files. Requires BLOB_READ_WRITE_TOKEN (see README "Environment variables").
export const runtime = "nodejs";

// The client checks this first (see use-live-document.ts's submitForInspection)
// before ever attempting a Blob upload. A plain 200 either way — a missing
// token is an expected, ordinary outcome in local dev, not a server error,
// so it must never surface as an HTTP error status: browsers log any failed
// resource load to the console regardless of whether application code
// handles it, which would mean a console "error" on every single local
// upload even though the app degrades correctly.
export function GET() {
  return Response.json({ available: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
    });
    return Response.json(jsonResponse);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload token generation failed." }, { status: 400 });
  }
}
