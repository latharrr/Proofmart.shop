import type { ReactNode } from "react";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import Tilt from "@/components/motion/tilt";
import SectionKicker from "@/components/home/section-kicker";
import OutputsStage from "@/components/home/outputs-stage";
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

// Keys recede, values read as paper, and the only saturated token in the
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
        <span key={k++} className="pm-mk-j-key">
          {m[1]}
        </span>,
        <span key={k++} className="pm-mk-j-punct">
          {m[2]}
        </span>,
      );
    } else if (m[1]) {
      out.push(
        <span key={k++} className={m[1] === '"FAIL"' ? "pm-mk-j-fail" : "pm-mk-j-val"}>
          {m[1]}
        </span>,
      );
    } else if (m[3]) {
      out.push(
        <span key={k++} className="pm-mk-j-val">
          {m[3]}
        </span>,
      );
    } else {
      out.push(
        <span key={k++} className="pm-mk-j-punct">
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

export default function OutputsSection() {
  return (
    <section id="outputs" className="pm-mk-section pm-mk-outputs" aria-labelledby="outputs-title">
      <div className="pm-wrap">
        <div className="pm-mk-head pm-mk-head-split">
          <div>
            <SectionKicker n="04">What you get back</SectionKicker>
            <LineReveal as="h2" id="outputs-title" className="pm-t-heading-lg">
              One verdict, <br />
              and the evidence.
            </LineReveal>
          </div>
          <div className="pm-mk-head-aside">
            <Reveal as="p" className="pm-t-body-lg pm-mk-lead">
              The API returns JSON you can route on. A saved scan also exports as a signed PDF dossier that anyone can check, no account needed.
            </Reveal>
          </div>
        </div>

        <OutputsStage
          json={
            <div className="pm-mk-json-card">
              <div className="pm-mk-json-head">
                <span className="pm-t-mono">POST /v1/verify</span>
                <span className="pm-t-mono pm-mk-json-status">
                  <span className="pm-mk-json-ok" aria-hidden="true" />
                  200 OK · application/json
                </span>
              </div>
              <div className="pm-mk-json" role="figure" aria-label="Sample /v1/verify response">
                {RESPONSE.split("\n").map((line, i) => {
                  const indent = line.length - line.trimStart().length;
                  return (
                    <div key={i} className="pm-mk-json-line" style={{ ["--indent" as string]: indent }}>
                      {highlight(line.trimStart())}
                    </div>
                  );
                })}
              </div>
            </div>
          }
        />

        <div className="pm-mk-outputs-below">
          <Reveal className="pm-mk-dossier-wrap">
            <Tilt max={6} className="pm-mk-dossier-tilt">
              <article className="pm-mk-dossier" aria-label="Sample signed dossier">
                <header className="pm-mk-dossier-top">
                  <span className="pm-mk-dossier-title">ProofMart Dossier</span>
                  <span className="pm-t-mono pm-mk-mute">req_8fk2.dossier.pdf</span>
                </header>
                <div className="pm-mk-dossier-subject">
                  <span className="pm-t-label pm-mk-mute">Subject</span>
                  <span className="pm-t-mono">hdfc_apr25_statement.pdf</span>
                </div>
                <div className="pm-mk-dossier-verdict">
                  <span className="pm-mk-verdict" data-tone="FAIL" data-size="lg">
                    <span aria-hidden="true">×</span>FAIL
                  </span>
                  <span className="pm-mk-mute">4 findings · 2 fail, 2 review</span>
                </div>
                <ul className="pm-mk-dossier-rows">
                  {DOSSIER.map((f) => (
                    <li key={f.id} data-tone={f.verdict}>
                      <span className="pm-t-mono pm-mk-mute">{f.addr}</span>
                      <span>
                        <span className="pm-t-mono">{f.id}</span>
                        <span className="pm-mk-dossier-body">{f.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <footer className="pm-mk-dossier-sig">
                  <span className="pm-t-label pm-mk-mute">Signature</span>
                  <span className="pm-t-mono">ed25519 · verifiable at /v1/verify-signature</span>
                </footer>
              </article>
            </Tilt>
          </Reveal>

          <div className="pm-mk-fields">
            <dl>
              {FIELDS.map((f, i) => (
                <Reveal key={f.key} delay={i * 80} className="pm-mk-field">
                  <dt className="pm-t-mono">{f.key}</dt>
                  <dd className="pm-t-body">{f.body}</dd>
                </Reveal>
              ))}
            </dl>
            <p className="pm-mk-note">
              Dossiers are signed from a saved, signed-in scan at <span className="pm-t-mono">/api/documents/[id]/dossier</span> and checked by anyone
              at <span className="pm-t-mono">/v1/verify-signature</span>. Signed-out scans aren&rsquo;t saved, so there is nothing to sign.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
