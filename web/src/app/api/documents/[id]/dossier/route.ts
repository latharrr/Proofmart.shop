import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { signVerificationResult, type SignedPayload } from "@/lib/signing/sign";
import { generateDossierPdf } from "@/lib/dossier/generate-pdf";
import type { DocumentRow } from "@/lib/documents";
import { checkRateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";

export const runtime = "nodejs";

const RATE_LIMIT = { windowSeconds: 600, limit: 30 };

function errorResponse(requestId: string, message: string, status: number) {
  return Response.json({ error: message, requestId }, { status });
}

/**
 * Issues a fresh, independently-verifiable dossier for a saved document —
 * a new `verification_signatures` row (and thus a new `verificationId`,
 * `timestamp`, and signature) every call, even for the same document. This
 * is deliberate: a dossier is a snapshot proof of "this is what the result
 * was at this moment," not a live pointer — Re-run can change a document's
 * `result` afterward without invalidating a dossier already handed to
 * someone else (see SignedPayload's own docstring).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = randomUUID();
  const start = Date.now();

  try {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (typeof userId !== "string") {
      logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 401, durationMs: Date.now() - start });
      return errorResponse(requestId, "Not signed in.", 401);
    }

    const allowed = await checkRateLimit(`dossier:user:${userId}`, RATE_LIMIT.windowSeconds, RATE_LIMIT.limit);
    if (!allowed) {
      logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 429, durationMs: Date.now() - start, userId, failureCategory: "rate_limited" });
      return errorResponse(requestId, `Too many requests. Limit: ${RATE_LIMIT.limit} per ${RATE_LIMIT.windowSeconds}s.`, 429);
    }

    const { data: doc } = await supabase
      .from("documents")
      .select("id, filename, status, result, verdict, verification_version, document_hash")
      .eq("id", id)
      .maybeSingle<Pick<DocumentRow, "id" | "filename" | "status" | "result" | "verdict" | "verification_version" | "document_hash">>();

    if (!doc) {
      logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 404, durationMs: Date.now() - start, userId });
      return errorResponse(requestId, "Document not found.", 404);
    }
    if (doc.status !== "ready" || !doc.result || !doc.verdict) {
      logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 400, durationMs: Date.now() - start, userId });
      return errorResponse(requestId, "This document has no completed verification result to sign.", 400);
    }
    if (!doc.document_hash) {
      logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 422, durationMs: Date.now() - start, userId });
      return errorResponse(requestId, "No recorded document hash for this document — re-run it to generate a dossier.", 422);
    }

    const payload: SignedPayload = {
      verificationId: randomUUID(),
      documentIdentifier: doc.id,
      engineVersion: doc.verification_version,
      timestamp: new Date().toISOString(),
      documentHash: doc.document_hash,
      verdict: doc.verdict,
      findings: doc.result.findings,
    };

    const signature = signVerificationResult(payload);
    if (!signature) {
      logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 503, durationMs: Date.now() - start, userId });
      return errorResponse(requestId, "Dossier signing is not configured on this deployment.", 503);
    }

    await supabase.from("verification_signatures").insert({
      id: payload.verificationId,
      document_id: doc.id,
      user_id: userId,
      document_hash: payload.documentHash,
      engine_version: payload.engineVersion,
      verdict: payload.verdict,
      payload,
      signature: signature.signature,
      algorithm: signature.algorithm,
      key_id: signature.keyId,
    });

    const pdfBytes = await generateDossierPdf({ filename: doc.filename, envelope: doc.result, signature });

    logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 200, durationMs: Date.now() - start, userId });
    return new Response(new Blob([new Uint8Array(pdfBytes)]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proofmart-dossier-${payload.verificationId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    // Never forward the raw exception to the client — log it server-side
    // (Vercel captures stdout automatically) and return a generic message.
    console.error(`[dossier] request ${requestId} failed:`, err instanceof Error ? err.message : err);
    logRequest({ requestId, route: "/api/documents/[id]/dossier", method: "GET", status: 500, durationMs: Date.now() - start, failureCategory: "unexpected_error" });
    return errorResponse(requestId, "Unexpected server error while generating the dossier.", 500);
  }
}
