import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { PLANS, type Plan } from "@/lib/billing/plans";
import { checkUsageQuota } from "@/lib/billing/usage";
import { isRazorpayConfigured } from "@/lib/billing/razorpay";
import { PRICING } from "@/lib/home-data";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import { formatDay } from "@/components/account/format";
import CreateCheckoutButton from "./create-checkout-button";

function price(plan: Plan): string {
  return `₹${(plan.priceInPaise / 100).toLocaleString("en-IN")}`;
}

/** The quota window is the calendar month in UTC (lib/billing/usage.ts), so it resets at 00:00 UTC on the 1st. */
function nextReset(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="pm-acct-plan-check">
      <path d="M3.5 8.4 6.5 11.2 12.5 4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function BillingPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  const usage = await checkUsageQuota(userId);
  const plan = PLANS[usage.plan];
  const isFree = usage.plan === "free";
  const left = Math.max(0, usage.limit - usage.used);
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const atLimit = usage.used >= usage.limit;
  const nearLimit = !atLimit && pct >= 80;
  const reset = formatDay(nextReset());
  const tierCopy = (id: string) => PRICING.find((t) => t.tier.toLowerCase() === id);

  return (
    <AppShell active="billing" email={email}>
      <AppPage>
        <AppPageHeader
          title="Billing"
          description="Your plan sets how many API calls you can make each month. Verifying documents in the browser is free and doesn't count."
        />

        <section className="pm-acct-usage" aria-labelledby="pm-acct-usage-title">
          <div className="pm-acct-usage-main">
            <h2 id="pm-acct-usage-title" className="pm-acct-label">
              API calls this month
            </h2>
            <p className="pm-acct-usage-figure">
              <span className="pm-acct-usage-n">{usage.used.toLocaleString("en-IN")}</span>
              <span className="pm-acct-usage-of"> of {usage.limit.toLocaleString("en-IN")}</span>
            </p>
            <div
              className="pm-acct-meter"
              role="progressbar"
              aria-label="API calls used this month"
              aria-valuemin={0}
              aria-valuemax={usage.limit}
              aria-valuenow={Math.min(usage.used, usage.limit)}
              aria-valuetext={`${usage.used} of ${usage.limit} calls used`}
              data-state={atLimit ? "full" : nearLimit ? "near" : undefined}
            >
              {usage.used > 0 && <span className="pm-acct-meter-fill" style={{ width: `${pct}%` }} />}
            </div>
            <p className="pm-acct-usage-note">
              {atLimit ? (
                <>
                  <strong>Limit reached.</strong> API calls are refused with <code className="pm-acct-code-inline">402 quota_exceeded</code> until {reset}.
                </>
              ) : (
                <>
                  <strong>{left.toLocaleString("en-IN")} left.</strong> {nearLimit ? "Running low. " : ""}The count resets on {reset}.
                </>
              )}
            </p>
          </div>

          <div className="pm-acct-usage-plan">
            <p className="pm-acct-label">Current plan</p>
            <p className="pm-acct-usage-plan-name">{plan.name}</p>
            <p className="pm-acct-usage-plan-price">{plan.priceInPaise === 0 ? "₹0 a month · no card on file" : `${price(plan)} a month, billed through Razorpay`}</p>
            {isFree && (
              <a href="#plans" className="pm-link">
                Compare plans
                <span className="pm-arrow" aria-hidden="true">
                  <span>↓</span>
                </span>
              </a>
            )}
          </div>
        </section>

        <section id="plans" className="pm-acct-section pm-acct-plans-section" aria-labelledby="pm-acct-plans-title">
          <div className="pm-acct-section-head">
            <h2 id="pm-acct-plans-title" className="pm-acct-h2">
              {isFree ? "What upgrading gets you" : "Plans"}
            </h2>
          </div>

          <div className="pm-acct-plans" data-upgrade={isFree ? "" : undefined}>
            {[PLANS.free, PLANS.pro].map((p) => {
              const copy = tierCopy(p.id);
              const current = p.id === usage.plan;
              const isPro = p.id === "pro";
              return (
                <article key={p.id} className="pm-acct-plan" data-accent={isPro ? "" : undefined} aria-labelledby={`pm-acct-plan-${p.id}`}>
                  <div className="pm-acct-plan-head">
                    <h3 id={`pm-acct-plan-${p.id}`} className="pm-acct-plan-name">
                      {p.name}
                    </h3>
                    {current && <span className="pm-acct-plan-current">Current plan</span>}
                  </div>
                  <p className="pm-acct-plan-price">
                    <span className="pm-acct-plan-amount">{price(p)}</span> / month
                  </p>
                  {copy && <p className="pm-acct-plan-body">{copy.body}</p>}
                  <ul className="pm-acct-plan-list">
                    <li>
                      <Check />
                      <span>
                        <strong>{p.monthlyVerifyLimit.toLocaleString("en-IN")}</strong> API calls a month
                      </span>
                    </li>
                    {(copy?.included ?? []).slice(1).map((line) => (
                      <li key={line}>
                        <Check />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  {isPro && isFree && (
                    <div className="pm-acct-plan-cta">
                      {isRazorpayConfigured() ? (
                        <>
                          <CreateCheckoutButton />
                          <p className="pm-acct-plan-fine">
                            Paid monthly through Razorpay. The new limit applies as soon as payment clears, including to calls already made this month.
                          </p>
                        </>
                      ) : (
                        <p className="pm-acct-plan-fine">Upgrading isn&rsquo;t available yet: payments aren&rsquo;t configured on this deployment.</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="pm-acct-section" aria-labelledby="pm-acct-count-title">
          <div className="pm-acct-section-head">
            <h2 id="pm-acct-count-title" className="pm-acct-h2">
              How calls are counted
            </h2>
          </div>
          <dl className="pm-acct-facts pm-acct-facts-row">
            <div>
              <dt>Counted</dt>
              <dd>
                Every call to <code className="pm-acct-code-inline">/v1/verify</code>, <code className="pm-acct-code-inline">/v1/inspect</code> or{" "}
                <code className="pm-acct-code-inline">/v1/extract</code> made with one of your{" "}
                <Link href="/account/api-keys" className="pm-acct-inline-link">
                  API keys
                </Link>
                , across all of them.
              </dd>
            </div>
            <div>
              <dt>Not counted</dt>
              <dd>Uploading and re-running documents in the browser, opening saved reports, and webhook deliveries.</dd>
            </div>
            <div>
              <dt>At the limit</dt>
              <dd>
                API calls return <code className="pm-acct-code-inline">402</code> until the 1st of next month (UTC). Separately, every plan has a per-minute rate limit on each key (60 verify calls a minute).
              </dd>
            </div>
          </dl>
        </section>
      </AppPage>
    </AppShell>
  );
}
