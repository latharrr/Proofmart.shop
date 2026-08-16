import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { PLANS, type PlanId } from "@/lib/billing/plans";

/**
 * The billing quota — how many /v1/verify calls a user's plan actually
 * allows this calendar month. Separate from lib/rate-limit.ts's per-minute
 * limiter, which exists for every caller regardless of plan (abuse
 * protection, not a product feature). Fails OPEN (allows the request) if
 * Supabase isn't configured, matching every other guard in this codebase —
 * a quota check that can 500 the request path it's attached to is worse
 * than one that occasionally under-enforces during an outage.
 */
export async function checkUsageQuota(userId: string): Promise<{ allowed: boolean; plan: PlanId; used: number; limit: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { allowed: true, plan: "free", used: 0, limit: PLANS.free.monthlyVerifyLimit };

  const { data: sub } = await supabase.from("subscriptions").select("plan, status").eq("user_id", userId).maybeSingle();
  const plan: PlanId = sub && sub.status === "active" && sub.plan === "pro" ? "pro" : "free";
  const limit = PLANS[plan].monthlyVerifyLimit;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("api_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "verify_request")
    .gte("created_at", monthStart.toISOString());

  if (error || count === null) return { allowed: true, plan, used: 0, limit };
  return { allowed: count < limit, plan, used: count, limit };
}
