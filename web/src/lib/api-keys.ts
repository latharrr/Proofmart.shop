import "server-only";

import { randomBytes, createHash } from "node:crypto";

const KEY_PREFIX = "pm_live_";
/** How much of the raw key is safe to display back to the user in a list — enough to recognize which key is which, not enough to reconstruct it. */
const DISPLAY_PREFIX_LENGTH = KEY_PREFIX.length + 8;

export interface GeneratedApiKey {
  /** Shown to the caller exactly once, at creation — never stored, never logged. */
  raw: string;
  prefix: string;
  hash: string;
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("base64url");
  const raw = `${KEY_PREFIX}${secret}`;
  return { raw, prefix: raw.slice(0, DISPLAY_PREFIX_LENGTH), hash: hashApiKey(raw) };
}

/** SHA-256 is sufficient here (not bcrypt/argon2): the key itself is a 24-byte random secret, not a low-entropy user password, so there's nothing for a fast hash to make brute-forceable. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
