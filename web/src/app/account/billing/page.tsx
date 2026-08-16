import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";
import { PLANS } from "@/lib/billing/plans";
import { checkUsageQuota } from "@/lib/billing/usage";
import { isRazorpayConfigured } from "@/lib/billing/razorpay";
import CreateCheckoutButton from "./create-checkout-button";

export default async function BillingPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");

  const usage = await checkUsageQuota(userId);
  const plan = PLANS[usage.plan];

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px" }}>
        <Link href="/" className="pm-hoverable" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, width: "fit-content" }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17, color: "#0E1216" }}>ProofMart</span>
        </Link>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>Billing</h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83", margin: "0 0 32px", lineHeight: 1.5 }}>
          Your plan governs the monthly quota on <code style={{ fontFamily: MONO }}>/v1/verify</code> calls. The web app&rsquo;s own upload flow is unmetered.
        </p>

        <div style={{ border: "1px solid #DDE1E4", borderRadius: 3, padding: "20px 16px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: "#0E1216" }}>{plan.name} plan</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#767C83" }}>
              {plan.priceInPaise === 0 ? "₹0/mo" : `₹${(plan.priceInPaise / 100).toLocaleString("en-IN")}/mo`}
            </span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: "#767C83" }}>
            {usage.used} / {usage.limit} /v1/verify calls used this month
          </div>
        </div>

        {usage.plan === "free" &&
          (isRazorpayConfigured() ? (
            <CreateCheckoutButton />
          ) : (
            <p style={{ fontFamily: SANS, fontSize: 13, color: "#767C83" }}>Upgrading isn&rsquo;t available yet — billing is not configured on this deployment.</p>
          ))}
      </div>
    </div>
  );
}
