import Reveal from "@/components/home/reveal";
import { PIPELINE } from "@/lib/home-data";

export default function PipelineSection() {
  return (
    <section id="pipeline" className="pm-band-paper">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">§ 02 · Pipeline</p>
            <h2 className="pm-h2">From bytes to bounded evidence.</h2>
          </div>
          <p className="pm-lead">
            Every stage writes back to the same address space: page, x, y, run. Click a finding in the rail and you land on the exact glyph that
            produced it — because that glyph&rsquo;s coordinates are what the finding was named after.
          </p>
        </Reveal>

        <ol className="pm-cols-4" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {PIPELINE.map((p, i) => (
            <Reveal key={p.i} as="li" delay={i * 300} className="pm-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
                  {p.i}
                </span>
                <span className="pm-mono" style={{ color: "var(--pm-slate)", fontVariantNumeric: "tabular-nums" }}>
                  {p.ms}
                </span>
              </div>
              <h3 className="pm-h3">{p.name}</h3>
              <p className="pm-body" style={{ color: "var(--pm-slate)", flex: 1 }}>
                {p.body}
              </p>
              <div className="pm-mono" style={{ color: "var(--pm-ash)", paddingTop: 12, borderTop: "1px solid var(--pm-hairline)", marginTop: "auto" }}>
                {p.signal}
              </div>
            </Reveal>
          ))}
        </ol>

        <p className="pm-body" style={{ marginTop: 24, color: "var(--pm-ash)" }}>
          Sample timings, taken from <span className="pm-mono">req_8fk2</span> on the rail above. Production timings vary with document, format, and
          marker set.
        </p>
      </div>
    </section>
  );
}
