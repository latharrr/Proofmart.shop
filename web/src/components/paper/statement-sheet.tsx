import type { CSSProperties } from "react";
import { SAMPLE_PAGES } from "@/components/evidence-rail/sample-statement";
import { fmt } from "@/lib/evidence-data";
import Tickmark, { PencilRing, type TickKind } from "./tickmark";

/**
 * Page 4 of the bundled SAMPLE statement, re-footed as a working paper: every
 * printed balance re-added and ticked, the two breaks marked in red pencil
 * and the unreadable row queried in blue. The figures are the same rows the
 * Evidence Rail draws (sample-statement.ts), so the sheet, the rail and the
 * API sample all describe one document.
 *
 * `animate` runs the tick cascade once on load: the marks are made in reading
 * order, the ring is drawn round row 17 last. Text never animates, and under
 * reduced motion the marks are simply there.
 */

const PAGE = SAMPLE_PAGES[3];

/** What the audit found on each row of page 4 (see SAMPLE_FINDINGS). */
const MARKS: Record<number, { kind: TickKind; tone: "fail" | "review"; note: string; spoken: string }> = {
  1: { kind: "break", tone: "fail", note: "p3 closed 23,760.00", spoken: "Break: page 3 closed at 23,760.00, page 4 brings 25,000.00 forward." },
  14: { kind: "query", tone: "review", note: "OCR read 0.62 < 0.75", spoken: "Query: the description was read at 0.62 confidence, below 0.75." },
  17: { kind: "break", tone: "fail", note: "84,210 + 12,500 = 96,710", spoken: "Break: 84,210.00 plus 12,500.00 is 96,710.00, the statement prints 91,710.00." },
};

function amount(debit: number | null, credit: number | null): string {
  if (debit) return `−${fmt(debit)}`;
  if (credit !== null && credit !== undefined) return `+${fmt(credit)}`;
  return "";
}

export default function StatementSheet({
  animate = false,
  className,
  showNotes = true,
  caption = "Schedule B-4 · page 4 of the sample statement, re-footed",
}: {
  animate?: boolean;
  className?: string;
  showNotes?: boolean;
  caption?: string;
}) {
  const rows = PAGE.rows;
  return (
    <figure className={className ? `pm-sheet ${className}` : "pm-sheet"} data-animate={animate ? "" : undefined} data-notes={showNotes ? "" : undefined}>
      <div className="pm-sheet-head">
        <span className="pm-sheet-title">
          Statement of account · <span style={{ whiteSpace: "nowrap" }}>XXXX-XX-4821</span>
        </span>
        <span className="pm-sheet-ref">B-4</span>
        <span className="pm-sheet-meta">
          <span>Page 4 of 6</span>
          <span>{PAGE.period}</span>
          <span>INR</span>
        </span>
        <span className="pm-sample">Sample</span>
      </div>

      <table className="pm-sheet-table">
        <caption className="pm-sr">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="pm-sheet-n">
              Row
            </th>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col" className="pm-num">
              Amount
            </th>
            <th scope="col" className="pm-num">
              Balance
            </th>
            <th scope="col" className="pm-sheet-tickh">
              <span className="pm-sr">Check</span>
            </th>
            {showNotes && (
              <th scope="col" className="pm-sheet-noteh">
                Note
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const mark = MARKS[r.n];
            const style = { ["--i" as string]: i } as CSSProperties;
            return (
              <tr key={r.n} data-tone={mark?.tone} style={style}>
                <td className="pm-sheet-n">{String(r.n).padStart(2, "0")}</td>
                <td className="pm-sheet-date">{r.date}</td>
                <td className="pm-sheet-desc">{r.desc}</td>
                <td className="pm-num">{amount(r.debit, r.credit)}</td>
                <td className="pm-num pm-sheet-bal">
                  {mark?.tone === "fail" ? (
                    <span className="pm-sheet-flag">
                      <s>{fmt(r.balance)}</s>
                      {r.n === 17 && <PencilRing className="pm-sheet-ring" />}
                    </span>
                  ) : (
                    fmt(r.balance)
                  )}
                </td>
                <td className="pm-sheet-tick">
                  <Tickmark kind={mark?.kind ?? "agreed"} title={mark ? mark.spoken : "Agrees"} />
                </td>
                {showNotes && <td className="pm-sheet-note">{mark?.note}</td>}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={4}>
              Carried to page 5, as printed
            </th>
            <td className="pm-num">
              <s>{fmt(PAGE.carried.amount)}</s>
            </td>
            <td className="pm-sheet-tick" />
            {showNotes && <td className="pm-sheet-note">should read 96,710.00</td>}
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}
