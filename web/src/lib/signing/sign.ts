import "server-only";

import { sign as cryptoSign, verify as cryptoVerify } from "node:crypto";
import { canonicalize } from "./canonicalize";
import { getSigningKeyPair, resolvePublicKey } from "./keys";
import type { Verdict, VerificationFinding } from "@/lib/verification/types";

/**
 * Everything a dossier's signature actually covers — self-contained, so a
 * recipient can verify it years later with nothing but this object, the
 * signature, and ProofMart's public key. No live document/user reference:
 * `documentHash` is the proof the payload is talking about a specific set
 * of bytes, not a mutable database row (see rerunDocument, which updates a
 * `documents` row in place — a dossier downloaded before a re-run must stay
 * independently valid after it).
 */
export interface SignedPayload {
  verificationId: string;
  documentIdentifier: string;
  engineVersion: string;
  timestamp: string;
  documentHash: string;
  verdict: Verdict;
  findings: VerificationFinding[];
}

export interface SignatureEnvelope {
  payload: SignedPayload;
  signature: string;
  algorithm: "ed25519";
  keyId: string;
}

/** Ed25519 via Node's built-in `crypto` — no external cryptography package, no invented scheme. Returns null only when no signing key is configured (see keys.ts); every other failure throws. */
export function signVerificationResult(payload: SignedPayload): SignatureEnvelope | null {
  const keys = getSigningKeyPair();
  if (!keys) return null;

  const data = Buffer.from(canonicalize(payload), "utf8");
  const signature = cryptoSign(null, data, keys.privateKey).toString("base64");
  return { payload, signature, algorithm: "ed25519", keyId: keys.keyId };
}

export type VerifyResult = { valid: true } | { valid: false; reason: string };

/** Recomputes the canonical bytes from `envelope.payload` and checks them against `envelope.signature` under the public key named by `envelope.keyId` — any change to any field of `payload` (including field order, which canonicalize() normalizes away, so this genuinely checks *content*, not formatting) produces different bytes and fails verification. */
export function verifyVerificationResult(envelope: SignatureEnvelope): VerifyResult {
  if (envelope.algorithm !== "ed25519") return { valid: false, reason: `Unsupported algorithm: ${envelope.algorithm}` };

  const publicKey = resolvePublicKey(envelope.keyId);
  if (!publicKey) return { valid: false, reason: `Unknown signing key: ${envelope.keyId}` };

  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(envelope.signature, "base64");
  } catch {
    return { valid: false, reason: "Malformed signature encoding." };
  }

  const data = Buffer.from(canonicalize(envelope.payload), "utf8");
  const valid = cryptoVerify(null, data, publicKey, signatureBytes);
  return valid ? { valid: true } : { valid: false, reason: "Signature does not match payload." };
}
