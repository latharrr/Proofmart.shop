import Reveal from "@/components/home/reveal";
import { PIPELINE } from "@/lib/home-data";

export default function PipelineSection() {
  return (
    <section id="pipeline" className="pm-band-paper">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">01 · How it works</p>
            <h2 className="pm-h2">Four passes, from bytes to a verdict.</h2>
          </div>
          <p className="pm-lead">
            Every pass writes to the same address space — page, x, y — so each finding points at the exact glyphs that produced it. Same bytes in,
            same result out, every time.
          </p>
        </Reveal>

        <ol className="pm-cols-4 pm-steps">
          {PIPELINE.map((p, i) => (
            <Reveal key={p.i} as="li" delay={i * 300} className="pm-card pm-step">
              <div className="pm-step-top">
                <span className="pm-mono" style={{ color: "var(--pm-ink)" }}>
                  {p.i}
                </span>
                <span className="pm-mono" style={{ color: "var(--pm-ash)", fontVariantNumeric: "tabular-nums" }}>
                  {p.ms}
                </span>
              </div>
              <h3 className="pm-h3">{p.name}</h3>
              <p className="pm-body" style={{ color: "var(--pm-slate)", flex: 1 }}>
                {p.body}
              </p>
              <div className="pm-mono pm-step-signal">{p.signal}</div>
            </Reveal>
          ))}
        </ol>

        <p className="pm-caption pm-section-note">
          Timings are from the sample scan in the rail above (<span className="pm-mono">req_8fk2</span>, 6 pages, 4.8 s). Real documents vary with
          length and how many pages need OCR.
        </p>
      </div>
    </section>
  );
}
