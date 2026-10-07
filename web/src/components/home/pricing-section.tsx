import Reveal from "@/components/home/reveal";
import { PRICING } from "@/lib/home-data";

export default function PricingSection() {
  return (
    <section id="pricing" className="pm-band-paper">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">05 · Pricing</p>
            <h2 className="pm-h2">Flat monthly. No per‑page metering.</h2>
          </div>
          <p className="pm-lead">
            Start free with the full engine. Upgrade when your team runs ProofMart inside a review or underwriting loop.
          </p>
        </Reveal>

        <div className="pm-cols-2">
          {PRICING.map((p, i) => {
            // The recommended plan is the page's single accent surface: peach
            // ground, sienna type, and nothing else on the page is warm.
            const accent = p.highlight === true;
            return (
              <Reveal
                key={p.tier}
                delay={i * 300}
                style={{
                  background: accent ? "var(--pm-peach)" : "var(--pm-mist)",
                  color: accent ? "var(--pm-sienna)" : "var(--pm-ink)",
                  borderRadius: "var(--pm-r-card)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 28 }}>
                  <p className="pm-eyebrow" style={{ margin: 0, color: accent ? "var(--pm-sienna)" : "var(--pm-ash)" }}>
                    {p.tier}
                  </p>
                  {accent && (
                    <span
                      className="pm-caption"
                      style={{
                        border: "1px solid var(--pm-sienna)",
                        borderRadius: "var(--pm-r-pill)",
                        padding: "2px 12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Recommended
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "var(--pm-serif)", fontWeight: 400, fontSize: 64, letterSpacing: "-1.6px", lineHeight: 1.1 }}>
                    {p.price}
                  </span>
                  <span className="pm-caption" style={{ color: accent ? "var(--pm-sienna)" : "var(--pm-slate)" }}>
                    {p.unit}
                  </span>
                </div>

                <p className="pm-body" style={{ color: accent ? "var(--pm-sienna)" : "var(--pm-slate)", maxWidth: "40ch" }}>
                  {p.body}
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: "16px 0 0",
                    borderTop: accent ? "1px solid rgba(93,42,26,0.2)" : "1px solid var(--pm-hairline)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {p.included.map((li) => (
                    <li key={li} className="pm-body" style={{ display: "flex", gap: 10 }}>
                      <span aria-hidden="true" style={{ opacity: 0.5 }}>
                        ·
                      </span>
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>

                <a href="/signup" className={accent ? "pm-btn pm-btn-filled" : "pm-btn pm-btn-ghost"} style={{ marginTop: "auto", alignSelf: "flex-start" }}>
                  {p.cta}
                </a>
              </Reveal>
            );
          })}
        </div>

        <p className="pm-caption pm-section-note" style={{ color: "var(--pm-slate)" }}>
          Prices in INR, billed monthly. A call is one <span className="pm-mono">/v1/verify</span> request, whatever the page count. Every key is
          also rate-limited to 60 requests a minute on both plans.
        </p>
      </div>
    </section>
  );
}
