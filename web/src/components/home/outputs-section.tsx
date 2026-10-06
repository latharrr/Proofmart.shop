import Reveal from "@/components/home/reveal";

// On the ink band the JSON is set in two neutrals plus one verdict colour:
// keys and punctuation recede, values read as paper, and the only saturated
// token in the whole block is the verdict itself.
const KEY = { color: "var(--pm-smoke)" };
const PUNCT = { color: "var(--pm-slate)" };
const VAL = { color: "var(--pm-paper)" };
const FAIL = { color: "var(--pm-fail)" };

export default function OutputsSection() {
  return (
    <section id="outputs" className="pm-band-ink">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow" style={{ color: "var(--pm-smoke)" }}>
              § 05 · Outputs
            </p>
            <h2 className="pm-h2" style={{ color: "var(--pm-paper)" }}>
              The JSON is real. So is the dossier.
            </h2>
          </div>
          <p className="pm-lead" style={{ color: "var(--pm-smoke)" }}>
            The JSON below is what the API returns today. A signed-in scan can also be exported as an Ed25519-signed PDF dossier your reviewers can
            countersign, built from the same finding graph — anyone can check that signature back against ProofMart, no account required.
          </p>
        </Reveal>

        <div className="pm-cols-2">
          <Reveal style={{ background: "var(--pm-ink-raised)", borderRadius: "var(--pm-r-card)", overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "14px 20px",
                borderBottom: "1px solid var(--pm-ink-hairline)",
              }}
            >
              <span className="pm-mono" style={{ color: "var(--pm-smoke)" }}>
                POST /v1/verify → 200 OK
              </span>
              <span className="pm-mono" style={{ color: "var(--pm-smoke)" }}>
                application/json
              </span>
            </div>
            <pre className="pm-mono" style={{ margin: 0, padding: 20, lineHeight: 1.7, letterSpacing: "0.02em", overflowX: "auto" }}>
              <span style={PUNCT}>{'{\n  "document": { '}</span>
              <span style={KEY}>&quot;filename&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>&quot;hdfc_apr25_statement.pdf&quot;</span>
              <span style={PUNCT}>{", "}</span>
              <span style={KEY}>&quot;pageCount&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>6</span>
              <span style={PUNCT}>{" },\n  "}</span>
              <span style={KEY}>&quot;verification&quot;</span>
              <span style={PUNCT}>{": {\n    "}</span>
              <span style={KEY}>&quot;verdict&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={FAIL}>&quot;FAIL&quot;</span>
              <span style={PUNCT}>{",\n    "}</span>
              <span style={KEY}>&quot;findings&quot;</span>
              <span style={PUNCT}>{": [{\n      "}</span>
              <span style={KEY}>&quot;markerId&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>&quot;BALANCE_BREAK&quot;</span>
              <span style={PUNCT}>{",\n      "}</span>
              <span style={KEY}>&quot;verdict&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={FAIL}>&quot;FAIL&quot;</span>
              <span style={PUNCT}>{",\n      "}</span>
              <span style={KEY}>&quot;evidence&quot;</span>
              <span style={PUNCT}>{": { "}</span>
              <span style={KEY}>&quot;summary&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>&quot;Running balance differs by -5,000.00&quot;</span>
              <span style={PUNCT}>{",\n        "}</span>
              <span style={KEY}>&quot;coordinates&quot;</span>
              <span style={PUNCT}>{": [{ "}</span>
              <span style={KEY}>&quot;page&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>4</span>
              <span style={PUNCT}>{", "}</span>
              <span style={KEY}>&quot;rect&quot;</span>
              <span style={PUNCT}>{": { "}</span>
              <span style={KEY}>&quot;x&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>548</span>
              <span style={PUNCT}>{", "}</span>
              <span style={KEY}>&quot;y&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>528</span>
              <span style={PUNCT}>{" } }]\n      }\n    }],\n    "}</span>
              <span style={KEY}>&quot;documentKind&quot;</span>
              <span style={PUNCT}>{": "}</span>
              <span style={VAL}>&quot;bank_statement&quot;</span>
              <span style={PUNCT}>{"\n  }\n}"}</span>
            </pre>
          </Reveal>

          <Reveal delay={300} style={{ background: "var(--pm-ink-raised)", borderRadius: "var(--pm-r-card)", overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "14px 20px",
                borderBottom: "1px solid var(--pm-ink-hairline)",
              }}
            >
              <span className="pm-mono" style={{ color: "var(--pm-smoke)" }}>
                req_8fk2.dossier.pdf
              </span>
              <span className="pm-caption" style={{ color: "var(--pm-smoke)" }}>
                Signed-in scans only
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div
                style={{
                  background: "var(--pm-paper)",
                  color: "var(--pm-ink)",
                  borderRadius: "var(--pm-r-image)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  minHeight: 380,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    borderBottom: "1px solid var(--pm-hairline)",
                    paddingBottom: 12,
                  }}
                >
                  <span className="pm-h3" style={{ fontSize: 20 }}>
                    ProofMart Dossier
                  </span>
                  <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
                    req_8fk2
                  </span>
                </div>
                <div>
                  <p className="pm-eyebrow" style={{ marginBottom: 4 }}>
                    Subject
                  </p>
                  <p className="pm-mono">hdfc_apr25_statement.pdf</p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "rgba(180,35,31,0.07)",
                    borderLeft: "3px solid var(--pm-fail)",
                    borderRadius: "0 var(--pm-r-image) var(--pm-r-image) 0",
                  }}
                >
                  <span className="pm-mono" style={{ color: "var(--pm-fail)" }}>
                    × FAIL
                  </span>
                  <span className="pm-caption">4 markers · 2 fail, 2 review</span>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { addr: "01 · p4", id: "BALANCE_BREAK", body: "Running balance short ₹5,000 on row 17." },
                    { addr: "02 · p4", id: "CROSS_PAGE_TOTAL_MISMATCH", body: "Balance carried from page 3 to page 4 differs by ₹1,240." },
                  ].map((f) => (
                    <div key={f.id} style={{ display: "grid", gridTemplateColumns: "64px minmax(0, 1fr)", gap: 12 }}>
                      <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
                        {f.addr}
                      </span>
                      <div>
                        <p className="pm-mono">{f.id}</p>
                        <p className="pm-caption" style={{ color: "var(--pm-slate)", marginTop: 4 }}>
                          {f.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid var(--pm-hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span className="pm-eyebrow" style={{ margin: 0 }}>
                    Signature
                  </span>
                  <span
                    className="pm-mono"
                    style={{ border: "1px solid var(--pm-ink)", borderRadius: "var(--pm-r-pill)", padding: "4px 14px", whiteSpace: "nowrap" }}
                  >
                    ed25519 · signed
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <p className="pm-body" style={{ marginTop: 24, color: "var(--pm-smoke)" }}>
          The JSON above matches the live API response shape. The dossier renders and signs from a saved, signed-in scan at{" "}
          <span className="pm-mono">/api/documents/[id]/dossier</span> — anonymous scans aren&rsquo;t saved, so there&rsquo;s nothing to sign.
        </p>
      </div>
    </section>
  );
}
