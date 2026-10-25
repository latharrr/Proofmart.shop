import { redirect } from "next/navigation";
import { createClient, getVerifiedClaims, isSupabaseConfigured } from "@/lib/supabase/server";
import { checkUsageQuota } from "@/lib/billing/usage";
import { isRazorpayConfigured } from "@/lib/billing/razorpay";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import BillingView from "@/components/account/billing-view";

/** The quota window is the calendar month in UTC (lib/billing/usage.ts), so it resets at 00:00 UTC on the 1st. */
function nextReset(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export default async function BillingPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await getVerifiedClaims(supabase);
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  const usage = await checkUsageQuota(userId);
  const now = new Date();
  const reset = nextReset(now);
  const daysLeft = Math.ceil((reset.getTime() - now.getTime()) / 86_400_000);

  return (
    <AppShell active="billing" email={email}>
      <AppPage>
        <AppPageHeader
          title="Billing"
          description="Your plan sets how many API calls you can make each month. Verifying documents in the browser is free and doesn't count."
        />
        <BillingView usage={usage} reset={reset} daysLeft={daysLeft} checkout={isRazorpayConfigured()} />
      </AppPage>
    </AppShell>
  );
}
