import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/pdf/types";

// Presigned-upload flow, not handleUpload/upload — see upload-safety.ts and
// isTrustedBlobUrl's comment. handleUpload's client-token flow has no
// `access` field anywhere in its return type, so it can only ever create
// PUBLIC blobs no matter what's requested (confirmed by reading
// node_modules/@vercel/blob's own .d.ts — this isn't a guess). Private vs.
// public is actually a property of the *Blob store itself*, chosen once
// when the store is created in the Vercel dashboard (Storage tab -> Create
// Database -> Blob -> Private) — the `access` values passed around in this
// file exist for type-safety/clarity and must match the store, not select
// it per upload. This route requires a store created as Private to be
// connected to the project (adds BLOB_READ_WRITE_TOKEN or, with OIDC,
// BLOB_STORE_ID + VERCEL_OIDC_TOKEN) — see README/.env.example.
export const runtime = "nodejs";

// The client checks this first (see use-live-document.ts's submitForInspection)
// before ever attempting a Blob upload — see the GET handler's original
// comment history for why this must stay a plain 200 either way.
export function GET() {
  return Response.json({
    available: Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      // No per-account auth gate on uploads today — ProofMart's core flow is
      // an anonymous public demo (see README), so "authorization" here means
      // scoping what a given upload token may do (content type, size, a
      // short-lived window), not requiring a signed-in user. Real per-account
      // rate limiting is a later, separate piece of work, not silently
      // dropped.
      getSignedToken: async (pathname) => ({
        token: await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          validUntil: Date.now() + 5 * 60 * 1000,
        }),
        urlOptions: {
          addRandomSuffix: true,
          allowOverwrite: false,
        },
      }),
    });
    return Response.json(jsonResponse);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload token generation failed." }, { status: 400 });
  }
}
