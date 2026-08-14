import { MONO, SANS } from "@/lib/evidence-data";
import { INTEGRATIONS } from "@/lib/home-data";

export default function IntegrateSection() {
  return (
    <section id="integrate" style={{ borderTop: "1px solid #2A2F35", background: "#0E1216", color: "#F5F5F0" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "88px 32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 4fr) minmax(0, 8fr)",
            gap: 56,
            alignItems: "end",
            marginBottom: 48,
          }}
        >
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em", marginBottom: 12 }}>§ 06 · INTEGRATE</div>
            <h2 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.025em", margin: 0, color: "#F5F5F0" }}>
              Four ways in.
              <br />
              Same signatures.
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.55, color: "#C2C7CC", maxWidth: "60ch", margin: "8px 0 0" }}>
            The transport changes; the evidence graph does not. Every path returns the same signed dossier, verifiable against the same public
            key.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid #2A2F35" }}>
          {INTEGRATIONS.map((it, i) => (
            <div
              key={it.name}
              style={{
                padding: "32px 24px 28px",
                borderRight: i < INTEGRATIONS.length - 1 ? "1px solid #2A2F35" : "none",
                borderBottom: "1px solid #2A2F35",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em" }}>{it.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.08em" }}>{it.kind.toUpperCase()}</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, color: "#C2C7CC" }}>{it.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
