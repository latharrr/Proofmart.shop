import type { ReactNode } from "react";
import Reveal from "@/components/home/reveal";

/*
 * The sample response, in the exact envelope lib/api/envelope.ts's
 * verifyEnvelope() returns: { document, classification, verdict, findings,
 * facts, processing } plus requestId. Trimmed (one finding shown, arrays
 * elided) but never reshaped — an earlier version nested verdict and findings
 * under a `verification` key the API has never returned.
 */
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
        "summary": "Running balance differs from prior + credit − debit by ₹5,000.00",
        "detail": "84,210.00 + 12,500.00 − 0.00 = 96,710.00 · document shows 91,710.00",
        "coordinates": [
          { "page": 4, "rect": { "x": 548, "y": 528, "w": 68, "h": 22 } }
        ]
      }
    },
    …3 more
  ],
  "processing": { "processingTimeMs": 4800, "markersRun": […6] }
}`;

// On the ink band the JSON is set in neutrals plus one verdict colour: keys
// recede, values read as paper, and the only saturated token in the block is
// the verdict itself.
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
        <span key={k++} style={{ color: "var(--pm-smoke)" }}>
          {m[1]}
        </span>,
        <span key={k++} style={{ color: "var(--pm-slate)" }}>
          {m[2]}
        </span>,
      );
    } else if (m[1]) {
      out.push(
        <span key={k++} style={{ color: m[1] === '"FAIL"' ? "var(--pm-fail)" : "var(--pm-paper)" }}>
          {m[1]}
        </span>,
      );
    } else if (m[3]) {
      out.push(
        <span key={k++} style={{ color: "var(--pm-paper)" }}>
          {m[3]}
        </span>,
      );
    } else {
      out.push(
        <span key={k++} style={{ color: "var(--pm-slate)" }}>
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
  { key: "verdict", body: "FAIL, REVIEW or CLEAR — or INCONCLUSIVE when no check had enough data to run." },
  { key: "evidence.detail", body: "The comparison the marker made, so a reviewer can redo it by hand." },
  { key: "coordinates[].rect", body: "Where on which page, in PDF points. Draw it over the page and you are looking at the cell." },
];

const DOSSIER_FINDINGS = [
  { addr: "p4 · r17", id: "BALANCE_BREAK", verdict: "FAIL", body: "Running balance short ₹5,000.00 on row 17." },
  { addr: "p3 → p4", id: "CROSS_PAGE_TOTAL_MISMATCH", verdict: "FAIL", body: "Balance carried from page 3 to page 4 differs by ₹1,240.00." },
  { addr: "p2 · r04", id: "DUPLICATE_TRANSACTION", verdict: "REVIEW", body: "Two rows share date 08 Apr and amount 2,500.00." },
  { addr: "p4 · r14", id: "OCR_LOW_CONFIDENCE", verdict: "REVIEW", body: "Description text read at 0.62 confidence, under 0.75." },
] as const;

export default function OutputsSection() {
  return (
    <section id="outputs" className="pm-band-ink">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow" style={{ color: "var(--pm-smoke)" }}>
              03 · What you get back
            </p>
            <h2 className="pm-h2" style={{ color: "var(--pm-paper)" }}>
              One verdict, and the evidence behind it.
            </h2>
          </div>
          <p className="pm-lead" style={{ color: "var(--pm-smoke)" }}>
            The API returns JSON you can route on. A saved scan can also be exported as a signed PDF dossier that anyone can check — no account
            needed.
          </p>
        </Reveal>

        <div className="pm-outputs-grid">
          <Reveal className="pm-ink-card">
            <div className="pm-ink-card-head">
              <span className="pm-mono" style={{ color: "var(--pm-paper)" }}>
                POST /v1/verify
              </span>
              <span className="pm-mono" style={{ color: "var(--pm-smoke)" }}>
                200 OK · application/json
              </span>
            </div>
            <div className="pm-mono pm-json" role="figure" aria-label="Sample /v1/verify response">
              {RESPONSE.split("\n").map((line, i) => {
                const indent = line.length - line.trimStart().length;
                return (
                  <div key={i} className="pm-json-line" style={{ ["--pm-indent" as string]: indent }}>
                    {highlight(line.trimStart())}
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={300} className="pm-ink-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="pm-ink-card-head">
              <span className="pm-mono" style={{ color: "var(--pm-paper)" }}>
                req_8fk2.dossier.pdf
              </span>
              <span className="pm-caption" style={{ color: "var(--pm-smoke)" }}>
                Saved scans
              </span>
            </div>
            <div style={{ padding: 20, flex: 1, display: "flex" }}>
              <div className="pm-dossier">
                <div className="pm-dossier-top">
                  <span style={{ fontSize: 20, fontWeight: 450 }}>ProofMart Dossier</span>
                  <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
                    req_8fk2
                  </span>
                </div>
                <div>
                  <p className="pm-caption" style={{ color: "var(--pm-ash)", marginBottom: 2 }}>
                    Subject
                  </p>
                  <p className="pm-mono">hdfc_apr25_statement.pdf</p>
                </div>
                <div className="pm-dossier-verdict">
                  <span className="pm-mono" style={{ color: "var(--pm-fail)" }}>
                    × FAIL
                  </span>
                  <span className="pm-caption">4 findings · 2 fail, 2 review</span>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {DOSSIER_FINDINGS.map((f) => (
                    <div key={f.id} className="pm-dossier-row">
                      <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
                        {f.addr}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p className="pm-mono">
                          {f.id}{" "}
                          <span className="pm-dossier-verdict-tag" style={{ color: f.verdict === "FAIL" ? "var(--pm-fail)" : "var(--pm-review)" }}>
                            {f.verdict === "FAIL" ? "×" : "~"} {f.verdict}
                          </span>
                        </p>
                        <p className="pm-caption" style={{ color: "var(--pm-slate)", marginTop: 2 }}>
                          {f.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pm-dossier-sig">
                  <span className="pm-caption" style={{ color: "var(--pm-ash)" }}>
                    Signature
                  </span>
                  <span className="pm-mono pm-verdict-pill" style={{ color: "var(--pm-ink)", borderColor: "var(--pm-ink)" }}>
                    ed25519 · verifiable
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <dl className="pm-fields">
          {FIELDS.map((f, i) => (
            <Reveal key={f.key} delay={i * 300} className="pm-field">
              <dt className="pm-mono" style={{ color: "var(--pm-paper)" }}>
                {f.key}
              </dt>
              <dd className="pm-caption" style={{ color: "var(--pm-smoke)", margin: "8px 0 0" }}>
                {f.body}
              </dd>
            </Reveal>
          ))}
        </dl>

        <p className="pm-caption pm-section-note" style={{ color: "var(--pm-smoke)" }}>
          Dossiers are signed from a saved, signed-in scan at <span className="pm-mono">/api/documents/[id]/dossier</span> and checked by anyone at{" "}
          <span className="pm-mono">/v1/verify-signature</span>. Signed-out scans aren&rsquo;t saved, so there is nothing to sign.
        </p>
      </div>
    </section>
  );
}
