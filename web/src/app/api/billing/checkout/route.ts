import { randomUUID } from "node:crypto";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createRazorpayClient, isRazorpayConfigured } from "@/lib/billing/razorpay";
import { PLANS } from "@/lib/billing/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/observability/log";

export const runtime = "nodejs";

const RATE_LIMIT = { windowSeconds: 3600, limit: 10 };

function errorResponse(requestId: string, message: string, status: number) {
  return Response.json({ error: message, requestId }, { status });
}

/**
 * POST /api/billing/checkout — creates a Razorpay order for the Pro plan
 * and returns the params the client hands to Razorpay's Checkout.js
 * (`new Razorpay(options).open()`). Signed-in users only. Payment
 * confirmation itself happens asynchronously via the webhook
 * (api/billing/webhook/route.ts) — this route only starts the flow, it
 * never marks anyone as upgraded.
 *
 * NOT LIVE-VERIFIED: no real Razorpay account/keys were available while
 * building this. Returns 503 rather than crashing when unconfigured.
 */
export async function POST() {
  const requestId = randomUUID();
  const start = Date.now();
  const route = "/api/billing/checkout";

  if (!isSupabaseConfigured()) {
    logRequest({ requestId, route, method: "POST", status: 401, durationMs: Date.now() - start });
    return errorResponse(requestId, "Not signed in.", 401);
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : undefined;
  if (typeof userId !== "string") {
    logRequest({ requestId, route, method: "POST", status: 401, durationMs: Date.now() - start });
    return errorResponse(requestId, "Not signed in.", 401);
  }

  const allowed = await checkRateLimit(`billing:checkout:user:${userId}`, RATE_LIMIT.windowSeconds, RATE_LIMIT.limit);
  if (!allowed) {
    logRequest({ requestId, route, method: "POST", status: 429, durationMs: Date.now() - start, userId, failureCategory: "rate_limited" });
    return errorResponse(requestId, `Too many requests. Limit: ${RATE_LIMIT.limit} per ${RATE_LIMIT.windowSeconds}s.`, 429);
  }

  if (!isRazorpayConfigured()) {
    logRequest({ requestId, route, method: "POST", status: 503, durationMs: Date.now() - start, userId, failureCategory: "service_unavailable" });
    return errorResponse(requestId, "Billing is not configured yet.", 503);
  }
  const razorpay = createRazorpayClient()!;

  const plan = PLANS.pro;
  try {
    const order = await razorpay.orders.create({
      amount: plan.priceInPaise,
      currency: plan.currency,
      receipt: `pm_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { userId, plan: plan.id },
    });

    // Best-effort — a bookkeeping failure here must not fail the checkout
    // the user is mid-flow on; the webhook is the source of truth for the
    // actual plan/status transition once payment is captured.
    const service = createServiceClient();
    if (service) {
      await service
        .from("subscriptions")
        .upsert({ user_id: userId, plan: "free", status: "active" }, { onConflict: "user_id", ignoreDuplicates: true })
        .then(
          () => {},
          () => {},
        );
    }

    logRequest({ requestId, route, method: "POST", status: 200, durationMs: Date.now() - start, userId });
    return Response.json({
      requestId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
      prefill: { email },
    });
  } catch {
    logRequest({ requestId, route, method: "POST", status: 502, durationMs: Date.now() - start, userId, failureCategory: "razorpay_error" });
    return errorResponse(requestId, "Could not start checkout.", 502);
  }
}
