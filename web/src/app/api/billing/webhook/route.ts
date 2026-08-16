import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyRazorpayWebhookSignature } from "@/lib/billing/razorpay";
import { recordAuditEvent } from "@/lib/audit";
import { logRequest } from "@/lib/observability/log";

export const runtime = "nodejs";

/**
 * POST /api/billing/webhook — Razorpay's server-to-server payment
 * notification. This, not the checkout route, is the only place a
 * subscription row actually flips to `pro` — the checkout route just
 * starts a payment, it never confirms one. Verifies
 * `X-Razorpay-Signature` against RAZORPAY_WEBHOOK_SECRET (set separately
 * from the API key pair, in the Razorpay dashboard's Webhooks section)
 * before trusting anything in the body, same principle as
 * lib/webhooks/hmac.ts on the outbound side of this app.
 *
 * Handles `order.paid` (one-time Pro upgrade — this integration uses
 * Razorpay Orders, not Subscriptions, so there is no recurring billing
 * cycle yet; current_period_end is left null deliberately rather than
 * guessed at). Every other event type is accepted (200, so Razorpay
 * doesn't retry it as failed) and ignored.
 *
 * NOT LIVE-VERIFIED: no real Razorpay account/webhook secret was available
 * while building this — the signature verification and event shape match
 * Razorpay's documented webhook format, but no real webhook call has been
 * received and processed end-to-end.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const start = Date.now();
  const route = "/api/billing/webhook";

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    logRequest({ requestId, route, method: "POST", status: 401, durationMs: Date.now() - start, failureCategory: "invalid_signature" });
    return Response.json({ error: "invalid signature", requestId }, { status: 401 });
  }

  let body: { event?: string; payload?: { order?: { entity?: { id?: string; notes?: Record<string, string> } } } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    logRequest({ requestId, route, method: "POST", status: 400, durationMs: Date.now() - start, failureCategory: "invalid_json" });
    return Response.json({ error: "invalid JSON", requestId }, { status: 400 });
  }

  if (body.event === "order.paid") {
    const userId = body.payload?.order?.entity?.notes?.userId;
    const razorpayOrderId = body.payload?.order?.entity?.id;
    if (typeof userId === "string") {
      const supabase = createServiceClient();
      if (supabase) {
        await supabase
          .from("subscriptions")
          .upsert({ user_id: userId, plan: "pro", status: "active", razorpay_customer_id: razorpayOrderId }, { onConflict: "user_id" });
        await recordAuditEvent({ userId, eventType: "billing_upgraded", metadata: { razorpayOrderId: razorpayOrderId ?? null } });
      }
    }
  }

  logRequest({ requestId, route, method: "POST", status: 200, durationMs: Date.now() - start, failureCategory: body.event });
  return Response.json({ received: true, requestId });
}
