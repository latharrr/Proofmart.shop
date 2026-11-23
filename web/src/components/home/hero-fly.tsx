import SampleDocument from "@/components/evidence-rail/sample-document";
import { TONE } from "@/components/evidence-rail/verdict-tone";
import { SAMPLE_FINDINGS, SAMPLE_VIEWBOX } from "@/components/evidence-rail/sample-statement";

const PAGE = 4;
const ON_PAGE = SAMPLE_FINDINGS.filter((f) => f.page === PAGE);

/**
 * The hero's travelling document (DESIGN.md, Motion: hero → rail). Page 4
 * of the SAMPLE statement, its findings' boxes ready to be drawn as the scan
 * line passes their rows, and a mono tag for each. Hidden unless the scroll
 * layer is running (html[data-fly]); it then rises under the headline, is
 * scanned, and docks into the Evidence Rail's page, which it matches exactly.
 * `--at` on each box is its row's position down the page (0–1), the moment
 * the scan line reaches it.
 */
export default function HeroFly() {
  return (
    <div className="pm-fly" aria-hidden="true">
      <div className="pm-fly-page">
        <SampleDocument page={PAGE} />
        <svg viewBox={`0 0 ${SAMPLE_VIEWBOX.w} ${SAMPLE_VIEWBOX.h}`} className="pm-fly-boxes">
          {ON_PAGE.map((f) => (
            <g key={f.id} className="pm-fly-box" data-at={(f.rects[0].y / SAMPLE_VIEWBOX.h).toFixed(3)}>
              <rect className="pm-fly-wash" x={f.rects[0].x} y={f.rects[0].y} width={f.rects[0].w} height={f.rects[0].h} rx={2} fill={TONE[f.verdict].wash} />
              <rect
                className="pm-fly-stroke"
                x={f.rects[0].x}
                y={f.rects[0].y}
                width={f.rects[0].w}
                height={f.rects[0].h}
                rx={2}
                fill="none"
                stroke={TONE[f.verdict].color}
                strokeWidth={2}
                pathLength={1}
                strokeDasharray={1}
              />
            </g>
          ))}
        </svg>
        {ON_PAGE.map((f) => (
          <span
            key={f.id}
            className="pm-fly-tag"
            data-tone={f.verdict}
            data-at={(f.rects[0].y / SAMPLE_VIEWBOX.h).toFixed(3)}
            style={{ top: `${((f.rects[0].y + f.rects[0].h) / SAMPLE_VIEWBOX.h) * 100}%` }}
          >
            {f.marker} · {f.addr1.replace("·", " ")}
          </span>
        ))}
        <span className="pm-fly-scan" />
        <span className="pm-fly-sample">Sample</span>
      </div>
    </div>
  );
}
