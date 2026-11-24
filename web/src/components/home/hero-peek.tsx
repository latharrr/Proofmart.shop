import { SAMPLE_FINDINGS, SAMPLE_PAGES } from "@/components/evidence-rail/sample-statement";
import { VERDICT, fmt } from "@/lib/evidence-data";

const PAGE = SAMPLE_PAGES[3];
const ROWS = PAGE.rows.filter((r) => r.n >= 13);
const [PRIOR, BROKEN] = ROWS.slice(-2);
const findingAt = (n: number) => SAMPLE_FINDINGS.find((f) => f.addr1 === `p4·r${n}`);

/**
 * The bottom of the first screen: the last rows of page 4 of the SAMPLE
 * statement, as the engine leaves them. Rows and figures come from the same
 * sample the Evidence Rail renders; the boxed rows are its findings.
 */
export default function HeroPeek() {
  return (
    <figure className="pm-peek" aria-label="Sample: the last rows of page 4, with two findings boxed">
      <div className="pm-peek-head">
        <span>meridian_apr25_statement.pdf · page 4 · {PAGE.period}</span>
        <span className="pm-sample">Sample</span>
      </div>
      <div className="pm-peek-rows" role="table">
        <div className="pm-peek-row pm-peek-cols" role="row">
          {["r", "date", "description", "debit", "credit", "balance", "finding"].map((h) => (
            <span key={h} role="columnheader">
              {h}
            </span>
          ))}
        </div>
        {ROWS.map((r) => {
          const f = findingAt(r.n);
          return (
            <div key={r.n} className="pm-peek-row" role="row" data-tone={f?.verdict}>
              <span role="cell">{String(r.n).padStart(2, "0")}</span>
              <span role="cell">{r.date}</span>
              <span role="cell">{r.desc}</span>
              <span role="cell">{r.debit === null ? "·" : fmt(r.debit)}</span>
              <span role="cell">{r.credit === null ? "·" : fmt(r.credit)}</span>
              <span role="cell">{fmt(r.balance)}</span>
              <span role="cell">
                {f && (
                  <span className="pm-vtag" data-tone={f.verdict} data-size="sm">
                    {VERDICT[f.verdict].glyph} {f.marker}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="pm-peek-math" data-tone="FAIL">
        <span>re-added r17</span> {fmt(PRIOR.balance)} + {fmt(BROKEN.credit)} = <b>{fmt(PRIOR.balance + (BROKEN.credit ?? 0))}</b> <span>· document shows</span> <s>{fmt(BROKEN.balance)}</s>
      </p>
      <span className="pm-peek-scan" aria-hidden="true" />
    </figure>
  );
}
