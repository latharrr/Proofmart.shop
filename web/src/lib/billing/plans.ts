export type PlanId = "free" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  /** Price in paise (Razorpay's base unit, like Stripe's cents) — 0 for free. PLACEHOLDER: not a real, confirmed price. Set with the business before enabling live checkout. */
  priceInPaise: number;
  currency: "INR";
  /** /v1/verify calls allowed per calendar month — the billing quota, separate from the existing per-minute abuse rate limit in lib/rate-limit.ts (that one exists even for a paying customer; this one is what a plan actually buys). */
  monthlyVerifyLimit: number;
}

/**
 * PLACEHOLDER PRICING — not confirmed with the business. The Razorpay
 * integration in lib/billing/razorpay.ts, the checkout/webhook routes, and
 * usage.ts's quota enforcement are all real and functional once
 * RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set, but the actual numbers below
 * (price, plan name, monthly limit) need a real decision before this goes
 * live — change only these two objects, nothing else in the billing code
 * needs to change alongside a pricing update.
 */
export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", priceInPaise: 0, currency: "INR", monthlyVerifyLimit: 50 },
  pro: { id: "pro", name: "Pro", priceInPaise: 99900, currency: "INR", monthlyVerifyLimit: 2000 },
};

export function planLimit(plan: PlanId): number {
  return PLANS[plan].monthlyVerifyLimit;
}
