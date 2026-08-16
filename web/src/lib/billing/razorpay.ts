import "server-only";

import Razorpay from "razorpay";

/**
 * Inert until RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set — returns null
 * rather than throwing, matching this codebase's established pattern
 * (Blob, Supabase service client, Google OAuth) of degrading a feature
 * instead of crashing the request that touches it. NOT LIVE-VERIFIED: no
 * real Razorpay account/keys were available while building this — the
 * request shapes below match Razorpay's documented Orders API exactly, but
 * a real checkout has not been exercised end-to-end.
 */
export function createRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** HMAC-SHA256 of the raw webhook body against RAZORPAY_WEBHOOK_SECRET (set separately from the API key pair in the Razorpay dashboard's Webhooks section) — Razorpay's own documented verification scheme, via the SDK's own utility rather than a hand-rolled HMAC. */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return Razorpay.validateWebhookSignature(rawBody, signature, secret);
}
