import Frame from "@/components/motion/frame";
import Tilt from "@/components/motion/tilt";

const SHEETS = [
  { n: 401, rows: [0.72, 0.5, 0.86, 0.6, 0.78, 0.44, 0.9, 0.66] },
  { n: 402, rows: [0.6, 0.82, 0.48, 0.74, 0.92, 0.56, 0.7, 0.84] },
  { n: 403, rows: [0.88, 0.62, 0.76, 0.5, 0.68, 0.94, 0.58, 0.8] },
];

/**
 * The 404's depth beat: the document examined page by page — sheets 401,
 * 402, 403 stacked on the desk in real CSS perspective — and where page 404
 * should lie, an empty volt outline on the crosshair grid. The stack drops
 * in once and a scan line passes over it; the pointer then tilts the desk
 * (damped, ≤ 8°). Nothing here takes a verdict colour: a missing page isn't
 * a verdict on anyone's document. Under reduced motion it's a still,
 * composed frame.
 */
export default function MissingPageStage() {
  return (
    <Frame tone="graphite" columns={4} label="p.404 · not in this document" className="pm-nf-frame" stageClassName="pm-nf-stage">
      <Tilt max={8} damping={6} className="pm-nf-scene" innerClassName="pm-nf-scene-inner">
        <div className="pm-nf-desk" aria-hidden="true">
          <div className="pm-nf-floor" />
          {SHEETS.map((s, i) => (
            <div key={s.n} className="pm-nf-sheet" style={{ ["--i" as string]: i }}>
              <div className="pm-nf-sheet-head">
                <span className="pm-nf-sheet-mark" />
                <span className="pm-nf-sheet-title">proofmart.shop</span>
                <span className="pm-nf-sheet-n">p.{s.n}</span>
              </div>
              <div className="pm-nf-sheet-sum">
                <span />
                <span />
                <span />
              </div>
              <div className="pm-nf-sheet-rows">
                {s.rows.map((w, j) => (
                  <span key={j} style={{ ["--w" as string]: w }} />
                ))}
              </div>
              {i === SHEETS.length - 1 ? <span className="pm-nf-scan" /> : null}
            </div>
          ))}
          <div className="pm-nf-slot">
            <span className="pm-nf-slot-c" data-c="tl" />
            <span className="pm-nf-slot-c" data-c="tr" />
            <span className="pm-nf-slot-c" data-c="bl" />
            <span className="pm-nf-slot-c" data-c="br" />
            <span className="pm-nf-slot-n">404</span>
          </div>
        </div>
      </Tilt>
    </Frame>
  );
}
