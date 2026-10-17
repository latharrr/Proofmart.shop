import type { ReactNode } from "react";
import SheetHead from "@/components/home/sheet-head";
import Tickmark, { VERDICT_TICK } from "@/components/paper/tickmark";
import { SAMPLE_FINDINGS } from "@/components/evidence-rail/sample-statement";

/*
 * The sample response, in the envelope lib/api/envelope.ts's verifyEnvelope()
 * returns: { document, classification, verdict, findings, facts, processing }
 * plus requestId. Trimmed (one finding shown, arrays elided) but never
 * reshaped.
 */
const BOX = SAMPLE_FINDINGS[0].rect!;
const RESPONSE = `{
  "requestId": "req_8fk2",
  "verdict": "FAIL",
  "classification": {
    "pdfType": "TextBased",
    "documentKind": "bank_statement"
  },
  "findings": [
    {
      "markerId": "BALANCE_BREAK",
      "verdict": "FAIL",
      "severity": "critical",
      "evidence": {
        "summary": "Running balance differs by ₹5,000.00",
        "detail": "84,210.00 + 12,500.00 = 96,710.00 · shows 91,710.00",
        "coordinates": [
          { "page": 4, "rect": { "x": ${BOX.x}, "y": ${BOX.y}, "w": ${BOX.w}, "h": ${BOX.h} } }
        ]
      }
    },
    …3 more
  ],
  "processing": { "processingTimeMs": 4800, "markersRun": […6] }
}`;

// Keys recede to pencil grey, values print in ink, and the only red in the
// block is the verdict itself.
const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d[\d.]*)|([{}[\],:])/g;

function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of src.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(src.slice(last, idx));
    if (m[1] && m[2]) {
      out.push(
        <span key={k++} className="pm-j-key">
          {m[1]}
        </span>,
        <span key={k++} className="pm-j-punct">
          {m[2]}
        </span>,
      );
    } else if (m[1]) {
      out.push(
        <span key={k++} className={m[1] === '"FAIL"' ? "pm-j-fail" : "pm-j-val"}>
          {m[1]}
        </span>,
      );
    } else if (m[3]) {
      out.push(
        <span key={k++} className="pm-j-val">
          {m[3]}
        </span>,
      );
    } else {
      out.push(
        <span key={k++} className="pm-j-punct">
          {m[4]}
        </span>,
      );
    }
    last = idx + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

const FIELDS = [
  { key: "verdict", body: "FAIL, REVIEW or CLEAR, or INCONCLUSIVE when no check had enough data to run. One field to route on." },
  { key: "evidence.detail", body: "The comparison the marker made, so a reviewer can redo it by hand." },
  { key: "coordinates[].rect", body: "Where, on which page, in PDF points. Draw it over the page and you are looking at the cell." },
];

const DOSSIER = SAMPLE_FINDINGS.map((f) => ({ addr: f.addr1.replace("·", " · "), id: f.marker, verdict: f.verdict as "FAIL" | "REVIEW", body: f.explanation }));

/**
 * What comes back: the API response as a printout clipped beside the field
 * notes, and the signed dossier as the sheet you hand to someone else.
 */
export default function OutputsSection() {
  return (
    <section id="outputs" className="pm-h-section" aria-labelledby="outputs-title">
      <div className="pm-wrap">
        <SheetHead
          id="outputs-title"
          wp="D"
          title="One verdict, and the evidence."
          aside={<p>The API returns JSON you can route on. A saved scan also exports as a signed PDF dossier that anyone can check, no account needed.</p>}
        />

        <div className="pm-h-outputs">
          <figure className="pm-print pm-h-json" aria-label="Sample /v1/verify response">
            <div className="pm-print-head">
              <span className="pm-mono">POST /v1/verify</span>
              <span className="pm-mono">200 OK · application/json</span>
              <span className="pm-sample">Sample</span>
            </div>
            <div className="pm-json" role="figure" aria-label="Sample /v1/verify response body">
              {RESPONSE.split("\n").map((line, i) => {
                const indent = line.length - line.trimStart().length;
                return (
                  <div key={i} className="pm-json-line" style={{ ["--indent" as string]: indent }}>
                    <span className="pm-json-n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{highlight(line.trimStart())}</span>
                  </div>
                );
              })}
            </div>
          </figure>

          <div className="pm-h-outputs-side">
            <dl className="pm-h-fields">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <dt className="pm-mono">{f.key}</dt>
                  <dd>{f.body}</dd>
                </div>
              ))}
            </dl>

            <article className="pm-dossier" aria-label="Sample signed dossier">
              <header className="pm-dossier-top">
                <span className="pm-dossier-title">ProofMart dossier</span>
                <span className="pm-mono">req_8fk2.dossier.pdf</span>
                <span className="pm-sample">Sample</span>
              </header>
              <div className="pm-dossier-row">
                <span className="pm-label">Subject</span>
                <span className="pm-mono">hdfc_apr25_statement.pdf</span>
              </div>
              <div className="pm-dossier-row">
                <span className="pm-label">Verdict</span>
                <span className="pm-vtag" data-tone="FAIL" data-size="lg">
                  <Tickmark kind="break" size={18} />
                  FAIL
                </span>
                <span className="pm-dossier-sub">4 findings · 2 fail, 2 review</span>
              </div>
              <ul className="pm-dossier-findings">
                {DOSSIER.map((f) => (
                  <li key={f.id} data-tone={f.verdict}>
                    <Tickmark kind={VERDICT_TICK[f.verdict]} size={15} />
                    <span className="pm-mono pm-dossier-addr">{f.addr}</span>
                    <span>
                      <span className="pm-mono">{f.id}</span>
                      <span className="pm-dossier-body">{f.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <footer className="pm-dossier-sig">
                <span className="pm-label">Signed</span>
                <span className="pm-mono">ed25519 · check it at /v1/verify-signature</span>
              </footer>
            </article>

            <p className="pm-note">
              Dossiers are signed from a saved, signed-in scan at <span className="pm-mono">/api/documents/[id]/dossier</span> and checked by anyone at{" "}
              <span className="pm-mono">/v1/verify-signature</span>. Signed-out scans aren&rsquo;t saved, so there is nothing to sign.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
