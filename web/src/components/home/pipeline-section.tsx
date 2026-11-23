import SectionHead, { Serif } from "@/components/home/section-head";
import { PIPELINE } from "@/lib/home-data";

/**
 * The tiny SAMPLE page that rides the progress line, changing at each pass
 * (`data-stage` 0–4): raw page → text layer lit → table grid → boxes →
 * the FAIL stamp. Decorative; the steps carry the words.
 */
function PipeDoc() {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <div className="pm-pipe-doc" data-stage="0" aria-hidden="true">
      <svg viewBox="0 0 64 80">
        <rect className="pm-pd-page" x="0.5" y="0.5" width="63" height="79" />
        <g className="pm-pd-text">
          {rows.map((r) => (
            <rect key={r} x="8" y={16 + r * 7} width={r % 3 === 0 ? 30 : 44} height="2.4" />
          ))}
        </g>
        <g className="pm-pd-grid">
          <path d="M6 13.5h52M6 71.5h52M24 13.5v58M42 13.5v58" />
        </g>
        <g className="pm-pd-boxes">
          <rect x="6" y="57" width="52" height="5" />
          <rect x="6" y="36" width="52" height="5" data-review="" />
        </g>
        <g className="pm-pd-stamp">
          <rect x="16" y="28" width="32" height="13" rx="2" />
          <text x="32" y="37.4" textAnchor="middle">
            FAIL
          </text>
        </g>
      </svg>
      <span className="pm-sample">Sample</span>
    </div>
  );
}

/**
 * The five passes on one hairline. With the scroll layer on a wide screen
 * the section pins and the steps run along a horizontal track while a
 * --signal line draws across, filling each node as it reaches it
 * (motion/home-scroll.ts). Without it (phones, reduced motion, no script)
 * every step and the finished line are simply there.
 */
export default function PipelineSection() {
  return (
    <section id="pipeline" className="pm-section pm-pipe" aria-labelledby="pipeline-title">
      <div className="pm-wrap">
        <SectionHead
          n="03"
          label="Pipeline"
          meta="Bytes → verdict"
          id="pipeline-title"
          title={
            <>
              Five passes. <Serif>Same bytes,</Serif> same result.
            </>
          }
          aside={
            <p>
              Every pass writes to one address space (page, x, y), so each finding points at the exact glyphs that produced it. Nothing in the path
              is learned or sampled: the same PDF always gives the same verdict, and the result records the engine version that gave it.
            </p>
          }
        />
      </div>
      <div className="pm-pipe-track">
        <div className="pm-pipe-stick">
          <div className="pm-wrap">
            <div className="pm-pipe-line" aria-hidden="true">
              <span className="pm-pipe-progress" />
            </div>
            <PipeDoc />
            <ol className="pm-pipe-steps">
              {PIPELINE.map((p, i) => (
                <li key={p.i} className="pm-pipe-step" style={{ ["--i" as string]: i }}>
                  <span className="pm-pipe-node" aria-hidden="true" />
                  <span className="pm-pipe-n">{p.i}</span>
                  <h3 className="pm-pipe-name">{p.name}</h3>
                  <p className="pm-pipe-body">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
