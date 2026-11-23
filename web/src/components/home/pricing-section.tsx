import RollPill from "@/components/motion/roll-pill";
import SectionHead from "@/components/home/section-head";
import Tickmark from "@/components/paper/tickmark";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { PRICING } from "@/lib/home-data";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/**
 * The plans as a ruled comparison table, the form a buyer's finance team
 * already reads. Price and quota come straight from lib/billing/plans.ts
 * (which marks them PLACEHOLDER), and so does the note under the table.
 */
export default function PricingSection() {
  const ids: PlanId[] = ["free", "pro"];
  const copy = (id: PlanId) => PRICING.find((p) => p.tier.toLowerCase() === id)!;
  const rows: { k: string; v: (id: PlanId) => string; tick?: boolean }[] = [
    { k: "For", v: (id) => copy(id).body },
    { k: "Verify calls / month", v: (id) => PLANS[id].monthlyVerifyLimit.toLocaleString("en-IN"), tick: true },
    { k: "Markers", v: () => "All six, same engine", tick: true },
    { k: "Ways in", v: () => "Upload, REST API, webhooks, CLI", tick: true },
    { k: "Support", v: (id) => (id === "pro" ? "Priority email support" : "—"), tick: true },
  ];

  return (
    <section id="pricing" className="pm-section" aria-labelledby="pricing-title">
      <div className="pm-wrap">
        <SectionHead
          n="07"
          label="Pricing"
          meta="INR · Razorpay"
          id="pricing-title"
          title="Flat monthly. No per-page metering."
          aside={<p>Start free with the full engine. Upgrade when your team runs ProofMart inside a review or underwriting loop.</p>}
        />

        <div className="pm-table-wrap" data-reveal="">
          <table className="pm-ledger pm-plans">
            <caption className="pm-sr">Plans compared</caption>
            <thead>
              <tr>
                <td />
                {ids.map((id) => (
                  <th key={id} scope="col" data-pro={id === "pro" ? "" : undefined}>
                    <span className="pm-plan-tier">{PLANS[id].name}</span>
                    <span className="pm-plan-price">
                      <span className="pm-mono">{INR.format(PLANS[id].priceInPaise / 100)}</span>
                      <span className="pm-plan-unit">/ month</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k}>
                  <th scope="row">{r.k}</th>
                  {ids.map((id) => {
                    const v = r.v(id);
                    return (
                      <td key={id} data-pro={id === "pro" ? "" : undefined}>
                        {r.tick && v !== "—" ? <Tickmark kind="agreed" size={14} /> : null}
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                {ids.map((id) => (
                  <td key={id}>
                    <RollPill href="/signup" variant={id === "pro" ? "primary" : "secondary"} dot={id === "pro"}>
                      {copy(id).cta}
                    </RollPill>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="pm-note pm-mono">Placeholder pricing — subject to change.</p>
        <p className="pm-note">
          Prices in INR, billed monthly through Razorpay. A call is one <span className="pm-mono">/v1/verify</span> request, whatever the page count. Every key
          is also rate-limited to 60 requests a minute on both plans.
        </p>
      </div>
    </section>
  );
}
