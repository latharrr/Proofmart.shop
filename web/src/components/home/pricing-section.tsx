import Reveal from "@/components/home/reveal";
import { PRICING } from "@/lib/home-data";

export default function PricingSection() {
  return (
    <section id="pricing" className="pm-band-paper">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">§ 07 · Pricing</p>
            <h2 className="pm-h2">Flat monthly. No per-document surprises.</h2>
          </div>
          <p className="pm-lead">One plan, one price, a monthly call limit on /v1/verify. No per-finding or per-scan metering.</p>
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
                  <span style={{ fontFamily: "var(--pm-serif)", fontWeight: 400, fontSize: 64, letterSpacing: "-0.025em", lineHeight: 1 }}>
                    {p.price}
                  </span>
                  <span className="pm-caption" style={{ color: accent ? "var(--pm-sienna)" : "var(--pm-slate)" }}>
                    {p.unit}
                  </span>
                </div>

                <p className="pm-body" style={{ color: accent ? "var(--pm-sienna)" : "var(--pm-slate)" }}>
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

                <a href="/signup" className={accent ? "pm-btn pm-btn-filled" : "pm-btn pm-btn-ghost"} style={{ marginTop: "auto" }}>
                  {p.cta}
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
