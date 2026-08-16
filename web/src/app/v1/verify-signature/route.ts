import { randomUUID } from "node:crypto";
import { verifyVerificationResult, type SignatureEnvelope } from "@/lib/signing/sign";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";

export const runtime = "nodejs";

/**
 * Public, unauthenticated by design — the whole point of a signed dossier is
 * that its recipient (a bank, an auditor, anyone who was handed the PDF, not
 * necessarily a ProofMart account holder) can check it without signing up
 * for anything. Cheap (one signature check, one indexed lookup), unlike
 * /v1/verify — no API key required and no usage event recorded.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();

  const body = await request.json().catch(() => null);
  const envelope = coerceEnvelope(body);
  if (!envelope) {
    return jsonError(requestId, 400, "invalid_request", "Expected { payload, signature, algorithm, keyId } — see a dossier's own \"Signature\" section.");
  }

  const cryptoResult = verifyVerificationResult(envelope);
  if (!cryptoResult.valid) {
    return jsonOk(requestId, { valid: false, reason: cryptoResult.reason });
  }

  // Cryptographically valid on its own is necessary but not sufficient: also
  // confirm ProofMart actually issued a signature with this id, and that
  // what's being checked hasn't been reconstructed to merely be
  // self-consistent (e.g. an old signature paired with a fabricated payload
  // that happens to canonicalize to something else already-signed is not
  // possible, but this also gives us a revocation point — deleting a
  // verification_signatures row invalidates that dossier here even though
  // the raw crypto would still pass).
  const service = createServiceClient();
  if (service) {
    const { data: issued } = await service
      .from("verification_signatures")
      .select("signature, document_hash, verdict")
      .eq("id", envelope.payload.verificationId)
      .eq("key_id", envelope.keyId)
      .maybeSingle();
    if (!issued || issued.signature !== envelope.signature || issued.document_hash !== envelope.payload.documentHash || issued.verdict !== envelope.payload.verdict) {
      return jsonOk(requestId, { valid: false, reason: "No matching ProofMart signature record found." });
    }
  }

  return jsonOk(requestId, { valid: true });
}

function coerceEnvelope(body: unknown): SignatureEnvelope | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const payload = b.payload as Record<string, unknown> | undefined;
  if (
    typeof b.signature !== "string" ||
    b.algorithm !== "ed25519" ||
    typeof b.keyId !== "string" ||
    !payload ||
    typeof payload.verificationId !== "string" ||
    typeof payload.documentIdentifier !== "string" ||
    typeof payload.engineVersion !== "string" ||
    typeof payload.timestamp !== "string" ||
    typeof payload.documentHash !== "string" ||
    typeof payload.verdict !== "string" ||
    !Array.isArray(payload.findings)
  ) {
    return null;
  }
  return b as unknown as SignatureEnvelope;
}
