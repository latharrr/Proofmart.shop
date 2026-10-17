import RollPill from "@/components/motion/roll-pill";
import SheetHead from "@/components/home/sheet-head";
import Tickmark from "@/components/paper/tickmark";
import { PLANS } from "@/lib/billing/plans";
import { PRICING } from "@/lib/home-data";

/**
 * The plans as a two-column comparison schedule, the form a buyer's finance
 * team already reads: one row per line item, one column per plan, and the
 * action written at the foot of each column. Mirrors lib/billing/plans.ts.
 */
export default function PricingSection() {
  const [free, pro] = PRICING;
  // Line items, each true of both columns as lib/billing/plans.ts and
  // lib/home-data.ts state them; a dash means the plan doesn't include it.
  const rows: { k: string; free: string; pro: string; tick?: boolean }[] = [
    { k: "For", free: free.body, pro: pro.body },
    {
      k: "Verify calls a month",
      free: PLANS.free.monthlyVerifyLimit.toLocaleString("en-IN"),
      pro: PLANS.pro.monthlyVerifyLimit.toLocaleString("en-IN"),
      tick: true,
    },
    { k: "Markers", free: "All six, same engine", pro: "All six, same engine", tick: true },
    { k: "Ways in", free: "Upload, REST API, webhooks, CLI", pro: "Upload, REST API, webhooks, CLI", tick: true },
    { k: "Support", free: "—", pro: "Priority email support", tick: true },
  ];
  return (
    <section id="pricing" className="pm-h-section" aria-labelledby="pricing-title">
      <div className="pm-wrap">
        <SheetHead
          id="pricing-title"
          wp="F"
          title="Flat monthly. No per-page metering."
          aside={<p>Start free with the full engine. Upgrade when your team runs ProofMart inside a review or underwriting loop.</p>}
        />

        <div className="pm-ledger-wrap">
          <table className="pm-ledger pm-h-plans">
            <caption className="pm-sr">Plans compared</caption>
            <thead>
              <tr>
                <td />
                {PRICING.map((p) => (
                  <th key={p.tier} scope="col" data-pro={p.highlight ? "" : undefined}>
                    <span className="pm-h-plan-tier">{p.tier}</span>
                    <span className="pm-h-plan-price">
                      <span className="pm-mono">{p.price}</span>
                      <span className="pm-h-plan-unit">{p.unit}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k}>
                  <th scope="row">{r.k}</th>
                  <td>
                    {r.tick && r.free !== "—" ? <Tickmark kind="agreed" size={15} /> : null}
                    {r.free}
                  </td>
                  <td data-pro="">
                    {r.tick ? <Tickmark kind="agreed" size={15} /> : null}
                    {r.pro}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                {PRICING.map((p) => (
                  <td key={p.tier}>
                    <RollPill href="/signup" variant={p.highlight ? "primary" : "secondary"} dot={p.highlight}>
                      {p.cta}
                    </RollPill>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="pm-note">
          Prices in INR, billed monthly. A call is one <span className="pm-mono">/v1/verify</span> request, whatever the page count. Every key is also
          rate-limited to 60 requests a minute on both plans.
        </p>
      </div>
    </section>
  );
}
