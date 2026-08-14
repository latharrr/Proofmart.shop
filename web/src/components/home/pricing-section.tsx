import { MONO, SANS } from "@/lib/evidence-data";
import { PRICING } from "@/lib/home-data";

export default function PricingSection() {
  return (
    <section id="pricing" style={{ borderTop: "1px solid #DDE1E4" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "88px 32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 4fr) minmax(0, 8fr)",
            gap: 56,
            marginBottom: 48,
            alignItems: "end",
          }}
        >
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em", marginBottom: 12 }}>§ 07 · PRICING</div>
            <h2 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.025em", margin: 0 }}>
              Per scan.
              <br />
              Per finding. Nothing else.
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.55, color: "#43494F", maxWidth: "52ch", margin: 0 }}>
            No seats, no minimums. A scan is one document up to 50 pages. Findings are metered when they change your decision — if we say CLEAR,
            it&rsquo;s free.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid #DDE1E4" }}>
          {PRICING.map((p, i) => (
            <div
              key={p.tier}
              style={{
                padding: "32px 28px 32px",
                borderRight: i < PRICING.length - 1 ? "1px solid #DDE1E4" : "none",
                background: p.highlight ? "#FAFAF7" : "#FFFFFF",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {p.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#0E1216" }} />}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.08em" }}>{p.tier.toUpperCase()}</span>
                {p.highlight && (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "#0E1216", letterSpacing: "0.1em", border: "1px solid #0E1216", padding: "2px 6px" }}>
                    RECOMMENDED
                  </span>
                )}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.price}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: "#767C83" }}>{p.unit}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", marginTop: 4, letterSpacing: "0.02em" }}>+ {p.scan}</div>
              </div>
              <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, color: "#43494F", margin: 0 }}>{p.body}</p>
              <div style={{ borderTop: "1px solid #DDE1E4", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {p.included.map((li) => (
                  <div key={li} style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: SANS, fontSize: 13, color: "#0E1216" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: "#43494F" }}>·</span>
                    <span>{li}</span>
                  </div>
                ))}
              </div>
              <a
                href="#cta"
                style={{
                  marginTop: "auto",
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  padding: "10px 12px",
                  textAlign: "center",
                  background: p.highlight ? "#0E1216" : "transparent",
                  color: p.highlight ? "#F5F5F0" : "#0E1216",
                  border: p.highlight ? "1px solid #0E1216" : "1px solid #DDE1E4",
                  textDecoration: "none",
                  borderRadius: 3,
                }}
              >
                {p.cta.toUpperCase()} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
