import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { signVerificationResult, type SignedPayload } from "@/lib/signing/sign";
import { generateDossierPdf } from "@/lib/dossier/generate-pdf";
import type { DocumentRow } from "@/lib/documents";

export const runtime = "nodejs";

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

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") return Response.json({ error: "Not signed in." }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id, filename, status, result, verdict, verification_version, document_hash")
    .eq("id", id)
    .maybeSingle<Pick<DocumentRow, "id" | "filename" | "status" | "result" | "verdict" | "verification_version" | "document_hash">>();

  if (!doc) return Response.json({ error: "Document not found." }, { status: 404 });
  if (doc.status !== "ready" || !doc.result || !doc.verdict) {
    return Response.json({ error: "This document has no completed verification result to sign." }, { status: 400 });
  }
  if (!doc.document_hash) {
    return Response.json({ error: "No recorded document hash for this document — re-run it to generate a dossier." }, { status: 422 });
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
  if (!signature) return Response.json({ error: "Dossier signing is not configured on this deployment." }, { status: 503 });

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

  return new Response(new Blob([new Uint8Array(pdfBytes)]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="proofmart-dossier-${payload.verificationId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
