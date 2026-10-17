import Link from "next/link";
import { PLANS, type Plan, type PlanId } from "@/lib/billing/plans";
import { PRICING } from "@/lib/home-data";
import Frame from "@/components/motion/frame";
import Tilt from "@/components/motion/tilt";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import CreateCheckoutButton from "@/app/account/billing/create-checkout-button";
import { formatDay } from "./format";

export type Usage = { plan: PlanId; used: number; limit: number };

const SEGMENTS = 50;

function price(plan: Plan): string {
  return `₹${(plan.priceInPaise / 100).toLocaleString("en-IN")}`;
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="pm-acct-plan-check">
      <path d="M3.5 8.4 6.5 11.2 12.5 4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Billing, as one reading: what you've used against what you have (a
 * 50-segment meter, one segment per call on Free), the plan you're on, and
 * what the next plan buys, as two columns side by side.
 */
export default function BillingView({ usage, reset, daysLeft, checkout }: { usage: Usage; reset: Date; daysLeft: number; checkout: boolean }) {
  const plan = PLANS[usage.plan];
  const isFree = usage.plan === "free";
  const left = Math.max(0, usage.limit - usage.used);
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const atLimit = usage.used >= usage.limit;
  const nearLimit = !atLimit && pct >= 80;
  const resetDay = formatDay(reset);
  const filled = usage.used > 0 ? Math.max(1, Math.round((pct / 100) * SEGMENTS)) : 0;
  const perSegment = Math.max(1, Math.round(usage.limit / SEGMENTS));
  const tierCopy = (id: string) => PRICING.find((t) => t.tier.toLowerCase() === id);
  const multiple = Math.round(PLANS.pro.monthlyVerifyLimit / PLANS.free.monthlyVerifyLimit);

  return (
    <>
      <Reveal as="section" className="pm-acct-card pm-acct-usage" aria-labelledby="pm-acct-usage-title">
        <div className="pm-acct-usage-main">
          <h2 id="pm-acct-usage-title" className="pm-t-label pm-acct-kicker">
            API calls this month
          </h2>
          <p className="pm-acct-usage-figure">
            <span className="pm-t-heading-lg pm-acct-usage-n">{usage.used.toLocaleString("en-IN")}</span>
            <span className="pm-t-heading-sm pm-acct-usage-of">/ {usage.limit.toLocaleString("en-IN")}</span>
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
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span key={i} className="pm-acct-meter-seg" data-on={i < filled ? "" : undefined} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <div className="pm-acct-meter-scale pm-t-mono" aria-hidden="true">
            <span>0</span>
            <span>{perSegment === 1 ? "1 segment = 1 call" : `1 segment = ${perSegment} calls`}</span>
            <span>{usage.limit.toLocaleString("en-IN")}</span>
          </div>
          <p className="pm-acct-usage-note">
            {atLimit ? (
              <>
                <span className="pm-acct-strong">Limit reached.</span> API calls are refused with <code className="pm-acct-code-inline">402 quota_exceeded</code> until{" "}
                {resetDay}.
              </>
            ) : (
              <>
                <span className="pm-acct-strong">{left.toLocaleString("en-IN")} left.</span> {nearLimit ? "Running low. " : ""}The count resets on {resetDay}
                {daysLeft > 0 ? `, in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : ""}.
              </>
            )}
          </p>
        </div>

        <div className="pm-acct-usage-plan">
          <p className="pm-t-label pm-acct-kicker">Current plan</p>
          <p className="pm-t-heading pm-acct-usage-plan-name">{plan.name}</p>
          <p className="pm-acct-hint">{plan.priceInPaise === 0 ? "₹0 a month · no card on file" : `${price(plan)} a month, billed through Razorpay`}</p>
          <dl className="pm-acct-usage-facts">
            <div>
              <dt className="pm-t-label">Quota</dt>
              <dd className="pm-t-mono">{plan.monthlyVerifyLimit.toLocaleString("en-IN")} / month</dd>
            </div>
            <div>
              <dt className="pm-t-label">Resets</dt>
              <dd className="pm-t-mono">{resetDay} · 00:00 UTC</dd>
            </div>
          </dl>
          {isFree && (
            <RollPill href="#plans" native variant="secondary" size="sm" className="pm-acct-usage-cta">
              Compare plans
            </RollPill>
          )}
        </div>
      </Reveal>

      <section id="plans" className="pm-acct-plans-section" aria-labelledby="pm-acct-plans-title">
        <div className="pm-acct-section-head pm-acct-section-head-open">
          <div>
            <h2 id="pm-acct-plans-title" className="pm-t-heading">
              {isFree ? "What upgrading gets you" : "Plans"}
            </h2>
          </div>
        </div>

        <div className="pm-acct-plans" data-upgrade={isFree ? "" : undefined}>
          {[PLANS.free, PLANS.pro].map((p, idx) => {
            const copy = tierCopy(p.id);
            const current = p.id === usage.plan;
            const isPro = p.id === "pro";
            const body = (
              <>
                <div className="pm-acct-plan-head">
                  <h3 id={`pm-acct-plan-${p.id}`} className="pm-t-label pm-acct-plan-name">
                    {p.name}
                  </h3>
                  {current && <span className="pm-t-label pm-acct-plan-current">Current plan</span>}
                </div>
                <p className="pm-acct-plan-price">
                  <span className="pm-t-heading-lg pm-acct-plan-amount">{price(p)}</span>
                  <span className="pm-acct-plan-unit">/ month</span>
                </p>
                {copy && <p className="pm-acct-plan-body">{copy.body}</p>}
                <p className="pm-acct-plan-calls">
                  <span className="pm-t-heading-sm">{p.monthlyVerifyLimit.toLocaleString("en-IN")}</span>
                  <span className="pm-acct-plan-calls-u">API calls a month</span>
                  {isPro && <span className="pm-t-mono pm-acct-plan-x">{multiple}× Free</span>}
                </p>
                <ul className="pm-acct-plan-list">
                  {(copy?.included ?? []).slice(1).map((line) => (
                    <li key={line}>
                      <Check />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                {isPro && isFree && (
                  <div className="pm-acct-plan-cta">
                    {checkout ? (
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
              </>
            );
            return isPro ? (
              <Reveal key={p.id} delay={idx * 80} className="pm-acct-plan-wrap">
                <Tilt max={5} damping={8} className="pm-acct-plan-tilt">
                  <Frame tone="sheet" label={isFree ? "Upgrade" : "Your plan"} className="pm-acct-plan-frame" stageClassName="pm-acct-plan-stage">
                    <article className="pm-acct-plan pm-acct-plan-pro" aria-labelledby={`pm-acct-plan-${p.id}`}>
                      {body}
                    </article>
                  </Frame>
                </Tilt>
              </Reveal>
            ) : (
              <Reveal key={p.id} delay={idx * 80} className="pm-acct-plan-wrap">
                <article className="pm-acct-plan pm-acct-plan-free" aria-labelledby={`pm-acct-plan-${p.id}`}>
                  {body}
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="pm-acct-count-section" aria-labelledby="pm-acct-count-title">
        <div className="pm-acct-section-head pm-acct-section-head-open">
          <div>
            <h2 id="pm-acct-count-title" className="pm-t-heading-sm">
              How calls are counted
            </h2>
          </div>
        </div>
        <dl className="pm-acct-facts pm-acct-facts-row">
          <div>
            <dt>
              <span className="pm-t-mono pm-acct-idx">01</span>
              <span className="pm-t-label">Counted</span>
            </dt>
            <dd>
              Every call to <code className="pm-acct-code-inline">/v1/verify</code>, <code className="pm-acct-code-inline">/v1/inspect</code> or{" "}
              <code className="pm-acct-code-inline">/v1/extract</code> made with one of your{" "}
              <Link href="/account/api-keys" className="pm-acct-text-link">
                API keys
              </Link>
              , across all of them.
            </dd>
          </div>
          <div>
            <dt>
              <span className="pm-t-mono pm-acct-idx">02</span>
              <span className="pm-t-label">Not counted</span>
            </dt>
            <dd>Uploading and re-running documents in the browser, opening saved reports, and webhook deliveries.</dd>
          </div>
          <div>
            <dt>
              <span className="pm-t-mono pm-acct-idx">03</span>
              <span className="pm-t-label">At the limit</span>
            </dt>
            <dd>
              API calls return <code className="pm-acct-code-inline">402</code> until the 1st of next month (UTC). Separately, every plan has a per-minute rate limit on
              each key (60 verify calls a minute).
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
