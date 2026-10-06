import Reveal from "@/components/home/reveal";
import { INTEGRATIONS } from "@/lib/home-data";

export default function IntegrateSection() {
  return (
    <section id="integrate" className="pm-band-fog">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">§ 06 · Integrate</p>
            <h2 className="pm-h2">Four ways in. Same engine, every time.</h2>
          </div>
          <p className="pm-lead">
            The upload flow above, the public API, webhook delivery and the CLI all run through the same verification engine — one processing path,
            not a marketing demo backed by something thinner.
          </p>
        </Reveal>

        <div className="pm-cols-4" style={{ gap: 0, borderTop: "1px solid var(--pm-hairline)" }}>
          {INTEGRATIONS.map((it, i) => (
            <Reveal
              key={it.name}
              delay={i * 300}
              className="pm-integrate-cell"
              style={{
                padding: 20,
                borderBottom: "1px solid var(--pm-hairline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <h3 className="pm-h3">{it.name}</h3>
                <span className="pm-caption" style={{ color: "var(--pm-ash)", whiteSpace: "nowrap" }}>
                  {it.kind}
                </span>
              </div>
              <p className="pm-body" style={{ color: "var(--pm-slate)" }}>
                {it.body}
              </p>
            </Reveal>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 28 }}>
          <a href="/account/api-keys" className="pm-link">
            Create an API key
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </a>
          <a href="/account/webhooks" className="pm-link">
            Register a webhook
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
