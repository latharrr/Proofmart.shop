import "server-only";

import { createHash, createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";

/**
 * The one keypair currently signing dossiers, loaded from base64-encoded
 * PEM env vars (see .env.example) — never hardcoded, so it can rotate
 * without a code change. `keyId` is a public fingerprint of the public key
 * (not a secret) embedded in every signed payload, so a future rotation can
 * still be told apart from — and `verifyVerificationResult` can still
 * validate — a dossier signed under a prior key, as long as that prior
 * public key stays resolvable by its id (see PUBLIC_KEYS_BY_ID below).
 */
export interface SigningKeyPair {
  keyId: string;
  privateKey: KeyObject;
  publicKey: KeyObject;
}

function decodeB64Pem(name: string): string | null {
  const raw = process.env[name];
  if (!raw) return null;
  return Buffer.from(raw, "base64").toString("utf8");
}

function keyIdFor(publicKey: KeyObject): string {
  const der = publicKey.export({ type: "spki", format: "der" });
  return createHash("sha256").update(der).digest("hex").slice(0, 16);
}

let cached: SigningKeyPair | null | undefined;

/** Returns null when dossier signing isn't configured — callers degrade (e.g. "Download dossier" unavailable) rather than crash, matching this codebase's pattern for every other optional integration. */
export function getSigningKeyPair(): SigningKeyPair | null {
  if (cached !== undefined) return cached;

  const privatePem = decodeB64Pem("PROOFMART_SIGNING_PRIVATE_KEY_B64");
  const publicPem = decodeB64Pem("PROOFMART_SIGNING_PUBLIC_KEY_B64");
  if (!privatePem || !publicPem) {
    cached = null;
    return cached;
  }

  const privateKey = createPrivateKey(privatePem);
  const publicKey = createPublicKey(publicPem);
  cached = { keyId: keyIdFor(publicKey), privateKey, publicKey };
  return cached;
}

/**
 * Public keys a downloaded dossier's signature can be checked against, by
 * the `keyId` embedded alongside its signature — today just the active
 * pair's own public key. A future key rotation adds the *old* public key
 * here (hardcoded, since it's no longer the active env-configured pair)
 * rather than removing it, so dossiers signed before the rotation keep
 * verifying.
 */
export function resolvePublicKey(keyId: string): KeyObject | null {
  const active = getSigningKeyPair();
  if (active && active.keyId === keyId) return active.publicKey;
  return null;
}
