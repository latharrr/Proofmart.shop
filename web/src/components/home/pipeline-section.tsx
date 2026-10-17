import SheetHead from "@/components/home/sheet-head";
import Tickmark from "@/components/paper/tickmark";
import { PIPELINE } from "@/lib/home-data";

/** "210 ms" / "1.4 s" → milliseconds, so the footing below is a real sum. */
function ms(t: string): number {
  const n = parseFloat(t);
  return t.trim().endsWith("ms") ? n : n * 1000;
}

const TOTAL = PIPELINE.reduce((s, p) => s + ms(p.ms), 0);

/**
 * The four passes as a schedule: one row per pass, what it writes, and the
 * time it took on the sample scan. The time column is footed, and the
 * footing is the sample's real total.
 */
export default function PipelineSection() {
  return (
    <section id="pipeline" className="pm-h-section" aria-labelledby="pipeline-title">
      <div className="pm-wrap">
        <SheetHead
          id="pipeline-title"
          wp="B"
          title="Four passes, bytes to verdict."
          aside={
            <p>
              Every pass writes to the same address space (page, x, y), so each finding points at the exact glyphs that produced it. Same bytes in,
              same result out, every time.
            </p>
          }
        />
        <div className="pm-ledger-wrap">
          <table className="pm-ledger pm-h-passes">
            <caption className="pm-sr">The four passes of a verification, with sample timings</caption>
            <thead>
              <tr>
                <th scope="col" className="pm-ledger-n">
                  Pass
                </th>
                <th scope="col">What it does</th>
                <th scope="col">Writes</th>
                <th scope="col" className="pm-num">
                  Sample time
                </th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE.map((p) => (
                <tr key={p.i}>
                  <th scope="row" className="pm-ledger-n">
                    <span className="pm-mono">{p.i}</span>
                    <span className="pm-h-pass-name">{p.name}</span>
                  </th>
                  <td className="pm-h-pass-body">{p.body}</td>
                  <td className="pm-mono pm-h-pass-writes">{p.signal}</td>
                  <td className="pm-num">{p.ms}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Sample scan <span className="pm-mono">req_8fk2</span>, 6 pages. Real documents vary with length and how many pages need OCR.
                </th>
                <td className="pm-num pm-footed">
                  {(TOTAL / 1000).toFixed(2)} s
                  <Tickmark kind="footed" size={15} title="Footed" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
