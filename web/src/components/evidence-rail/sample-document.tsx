import { fmt } from "@/lib/evidence-data";
import { ROW_H, ROW_TOP, SAMPLE_PAGE_COUNT, SAMPLE_PAGES, SAMPLE_VIEWBOX } from "./sample-statement";

const MONO = "var(--font-mono), ui-monospace, monospace";
const SANS = "var(--font-sans), system-ui, sans-serif";
// The bank's PDF keeps a printer's neutral greys: it is a document from
// somewhere else, set on white, not part of the console's palette.
const INK = "#1d1f22";
const MUTE = "#666a6e";
const LINE = "#dcddd8";

/**
 * One page of the bundled SAMPLE statement, drawn on the same 640×800 mock
 * page the findings' boxes are measured against (sample-statement.ts). Pure
 * SVG, so the rail, the report empty state and the outputs thumbnail all
 * draw the exact same page.
 */
export default function SampleDocument({ page, className = "pm-doc-svg" }: { page: number; className?: string }) {
  const data = SAMPLE_PAGES[page - 1];
  const tableEnd = ROW_TOP + data.rows.length * ROW_H;
  return (
      <svg
        viewBox={`0 0 ${SAMPLE_VIEWBOX.w} ${SAMPLE_VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className={className}
        aria-label={`Sample statement, page ${page} of ${SAMPLE_PAGE_COUNT}`}
        role="img"
      >
        <text x={32} y={34} fontFamily={MONO} fontSize={11} fill={MUTE} letterSpacing={1.2}>
          PAGE {String(page).padStart(2, "0")} · {data.period}
        </text>
        <text x={608} y={34} fontFamily={MONO} fontSize={11} fill={MUTE} textAnchor="end">
          {page > 1 ? `continued from p${page - 1}` : "statement of account"}
        </text>

        <g transform="translate(32, 62)">
          <path d="M0 -2h18v18H0z" fill={INK} />
          <text x={28} y={13} fontFamily={SANS} fontSize={18} fill={INK} letterSpacing="-0.01em">
            MERIDIAN TRUST BANK
          </text>
          <text x={252} y={13} fontFamily={SANS} fontSize={13} fill={MUTE}>
            Statement of Account
          </text>
        </g>

        <g transform="translate(32, 112)">
          <text x={0} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2}>
            ACCOUNT
          </text>
          <text x={0} y={20} fontFamily={MONO} fontSize={14} fill={INK}>
            XXXX-XX-4821
          </text>
          <text x={200} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2}>
            HOLDER
          </text>
          <text x={200} y={20} fontFamily={SANS} fontSize={15} fill={INK}>
            Rajesh Sharma
          </text>
          <text x={392} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2}>
            PRODUCER
          </text>
          <text x={392} y={20} fontFamily={MONO} fontSize={14} fill={INK}>
            Microsoft Word 2016
          </text>
        </g>

        <line x1={32} y1={160} x2={608} y2={160} stroke={LINE} strokeWidth={1} />

        <g transform="translate(0, 218)">
          {[
            { x: 46, t: "#", a: "end" as const },
            { x: 56, t: "DATE" },
            { x: 116, t: "DESCRIPTION" },
            { x: 424, t: "DEBIT", a: "end" as const },
            { x: 518, t: "CREDIT", a: "end" as const },
            { x: 612, t: "BALANCE", a: "end" as const },
          ].map((h) => (
            <text key={h.t} x={h.x} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2} textAnchor={h.a}>
              {h.t}
            </text>
          ))}
        </g>
        <line x1={28} y1={229} x2={616} y2={229} stroke="#b9bbb5" strokeWidth={1.25} />

        {data.rows.map((t) => {
          const y = ROW_TOP + (t.n - 1) * ROW_H;
          const muted = t.debit === null && t.credit === null;
          return (
            <g key={t.n} transform={`translate(0, ${y})`}>
              <text x={46} y={17} fontFamily={MONO} fontSize={12} fill={MUTE} textAnchor="end">
                {String(t.n).padStart(2, "0")}
              </text>
              <text x={56} y={17} fontFamily={MONO} fontSize={12.5} fill={INK}>
                {t.date}
              </text>
              <text x={116} y={17} fontFamily={SANS} fontSize={13.5} fill={muted ? MUTE : INK}>
                {t.desc}
              </text>
              <text x={424} y={17} fontFamily={MONO} fontSize={12.5} fill={t.debit ? INK : "#b9bbb5"} textAnchor="end">
                {fmt(t.debit)}
              </text>
              <text x={518} y={17} fontFamily={MONO} fontSize={12.5} fill={t.credit !== null ? INK : "#b9bbb5"} textAnchor="end">
                {fmt(t.credit)}
              </text>
              <text x={612} y={17} fontFamily={MONO} fontSize={12.5} fill={INK} textAnchor="end">
                {fmt(t.balance)}
              </text>
              <line x1={28} y1={ROW_H} x2={616} y2={ROW_H} stroke="#ecece8" strokeWidth={1} />
            </g>
          );
        })}

        <g transform={`translate(0, ${tableEnd + 30})`}>
          <text x={32} y={0} fontFamily={MONO} fontSize={11} fill={MUTE} letterSpacing={1.2}>
            {data.carried.label}
          </text>
          <text x={612} y={0} fontFamily={MONO} fontSize={13} fill={INK} textAnchor="end">
            {fmt(data.carried.amount)}
          </text>
        </g>
        <line x1={32} y1={tableEnd + 42} x2={608} y2={tableEnd + 42} stroke={LINE} strokeWidth={1} />

        <text x={32} y={752} fontFamily={MONO} fontSize={9} fill={MUTE} letterSpacing={1.2}>
          MERIDIAN TRUST BANK LIMITED · REGD. OFFICE MERIDIAN HOUSE, MUMBAI
        </text>
        <text x={32} y={766} fontFamily={MONO} fontSize={9} fill={MUTE} letterSpacing={1.2}>
          CIN U65999MH2020PLC000000 · SAMPLE FOR DEMONSTRATION
        </text>
        <text x={608} y={766} fontFamily={MONO} fontSize={9} fill={MUTE} letterSpacing={1.2} textAnchor="end">
          PAGE {page} / {SAMPLE_PAGE_COUNT}
        </text>
      </svg>
  );
}
