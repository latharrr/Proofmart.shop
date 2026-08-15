import { MONO, SANS } from "@/lib/evidence-data";
import { PIPELINE } from "@/lib/home-data";

export default function PipelineSection() {
  return (
    <section id="pipeline" style={{ borderTop: "1px solid #DDE1E4", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "88px 32px" }}>
        <div
          className="pm-split-grid-48"
          style={{
            display: "grid",
            gap: 56,
            alignItems: "start",
            marginBottom: 56,
          }}
        >
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em", marginBottom: 12 }}>§ 02 · PIPELINE</div>
            <h2 className="pm-h2" style={{ fontFamily: SANS, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 16px" }}>
              From bytes
              <br />
              to bounded evidence.
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.55, color: "#43494F", maxWidth: "62ch", margin: "8px 0 0" }}>
            Every stage writes back to the same address space: page, x, y, run. When you click a finding in the rail you land on the exact glyph
            that produced it — because that glyph&rsquo;s coordinates are what the finding was named after.
          </p>
        </div>

        <div className="pm-cols-4" style={{ display: "grid", gap: 0, borderTop: "1px solid #DDE1E4", borderBottom: "1px solid #DDE1E4" }}>
          {PIPELINE.map((p, i) => (
            <div
              key={p.i}
              style={{
                padding: "32px 24px 28px",
                borderRight: i < PIPELINE.length - 1 ? "1px solid #DDE1E4" : "none",
                background: "#FAFAF7",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em" }}>{p.i}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#B4231F", letterSpacing: "0.06em" }}>{p.ms}</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", marginBottom: 12 }}>{p.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: "#43494F", marginBottom: 20, minHeight: 84 }}>{p.body}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "#0E1216", letterSpacing: "0.02em", paddingTop: 14, borderTop: "1px dashed #DDE1E4" }}>
                {p.signal}
              </div>
              {i < PIPELINE.length - 1 && (
                <div
                  className="pm-flow-arrow"
                  style={{
                    position: "absolute",
                    right: -6,
                    top: 40,
                    width: 12,
                    height: 12,
                    background: "#FAFAF7",
                    borderRight: "1px solid #DDE1E4",
                    borderTop: "1px solid #DDE1E4",
                    transform: "rotate(45deg)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.04em" }}>
          SAMPLE · timings from REQ_8FK2 on the rail above. Production timings vary with document, format, and marker set.
        </div>
      </div>
    </section>
  );
}
