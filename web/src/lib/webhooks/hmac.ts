import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA256 over the exact bytes sent — the receiver recomputes this over the raw request body, so the signer and verifier must both operate on the same serialization, never a re-parsed/re-stringified object. */
export function signWebhookBody(rawBody: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

export function verifyWebhookSignature(rawBody: string, secret: string, header: string): boolean {
  const expected = signWebhookBody(rawBody, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
