import { MONO, SANS } from "@/lib/evidence-data";

export default function OutputsSection() {
  return (
    <section id="outputs" style={{ borderTop: "1px solid #DDE1E4", background: "#0E1216", color: "#F5F5F0" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "88px 32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 4fr) minmax(0, 8fr)",
            gap: 56,
            alignItems: "start",
            marginBottom: 48,
          }}
        >
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em", marginBottom: 12 }}>§ 05 · OUTPUTS</div>
            <h2 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 16px", color: "#F5F5F0" }}>
              Two shapes.
              <br />
              Same evidence.
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.55, color: "#C2C7CC", maxWidth: "60ch", margin: "8px 0 0" }}>
            The JSON is what your services read. The PDF dossier is what your reviewers sign. Both are produced from the same finding graph —
            the two artifacts can never disagree.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 32 }}>
          {/* JSON output */}
          <div style={{ background: "#14181D", border: "1px solid #2A2F35", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #2A2F35" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.08em" }}>POST /v1/analyze → 200 OK</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83" }}>application/json</span>
            </div>
            <pre style={{ margin: 0, padding: "18px 20px", fontFamily: MONO, fontSize: 12, lineHeight: 1.65, color: "#F5F5F0", overflowX: "auto" }}>
              <span style={{ color: "#767C83" }}>{"{\n  "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;request_id&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#E2C48A" }}>&quot;req_8fk2&quot;</span>
              <span style={{ color: "#767C83" }}>{",\n  "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;verdict&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#E38A82" }}>&quot;FAIL&quot;</span>
              <span style={{ color: "#767C83" }}>{",\n  "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;findings&quot;</span>
              <span style={{ color: "#767C83" }}>{": [\n    {\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;marker&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#E2C48A" }}>&quot;BALANCE_BREAK&quot;</span>
              <span style={{ color: "#767C83" }}>{",\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;page&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#C9D1B6" }}>4</span>
              <span style={{ color: "#767C83" }}>{",\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;box&quot;</span>
              <span style={{ color: "#767C83" }}>{": ["}</span>
              <span style={{ color: "#C9D1B6" }}>548</span>
              <span style={{ color: "#767C83" }}>{", "}</span>
              <span style={{ color: "#C9D1B6" }}>528</span>
              <span style={{ color: "#767C83" }}>{", "}</span>
              <span style={{ color: "#C9D1B6" }}>68</span>
              <span style={{ color: "#767C83" }}>{", "}</span>
              <span style={{ color: "#C9D1B6" }}>22</span>
              <span style={{ color: "#767C83" }}>{"],\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;expected&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#C9D1B6" }}>96710.00</span>
              <span style={{ color: "#767C83" }}>{",\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;found&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#C9D1B6" }}>91710.00</span>
              <span style={{ color: "#767C83" }}>{",\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;delta&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#C9D1B6" }}>-5000.00</span>
              <span style={{ color: "#767C83" }}>{",\n      "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;confidence&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#C9D1B6" }}>1.00</span>
              <span style={{ color: "#767C83" }}>{"\n    }\n  ],\n  "}</span>
              <span style={{ color: "#A9BFD8" }}>&quot;signature&quot;</span>
              <span style={{ color: "#767C83" }}>{": "}</span>
              <span style={{ color: "#E2C48A" }}>&quot;ed25519:8f…3c&quot;</span>
              <span style={{ color: "#767C83" }}>{"\n}"}</span>
            </pre>
          </div>

          {/* PDF dossier */}
          <div style={{ background: "#14181D", border: "1px solid #2A2F35", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #2A2F35" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.08em" }}>req_8fk2.dossier.pdf</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83" }}>signed · 3 pages</span>
            </div>
            <div style={{ padding: 24, background: "#14181D", height: "100%", display: "flex", alignItems: "stretch" }}>
              <div
                style={{
                  flex: 1,
                  background: "#F5F5F0",
                  color: "#0E1216",
                  padding: "22px 24px",
                  fontFamily: SANS,
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  minHeight: 380,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #DDE1E4", paddingBottom: 10 }}>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>ProofMart Dossier</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.08em" }}>REQ_8FK2 · 12 AUG 2026</div>
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em" }}>SUBJECT</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 2 }}>hdfc_apr25_statement.pdf</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(180,35,31,0.08)", borderLeft: "2px solid #B4231F" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "#B4231F", letterSpacing: "0.08em" }}>× FAIL</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: "#0E1216" }}>4 markers · 2 fail, 2 review</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", rowGap: 10, columnGap: 10, fontSize: 12 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83" }}>01 · p4</div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500 }}>BALANCE_BREAK</div>
                    <div style={{ color: "#43494F", fontSize: 11, lineHeight: 1.4 }}>Running balance short ₹5,000 on row 17.</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83" }}>02 · p4</div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500 }}>PRODUCER_MISMATCH</div>
                    <div style={{ color: "#43494F", fontSize: 11, lineHeight: 1.4 }}>PDF authored in MS Word 2016, not bank template.</div>
                  </div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid #DDE1E4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: "#767C83", letterSpacing: "0.1em" }}>SIGNED ED25519 · 8F…3C</div>
                  <div style={{ width: 44, height: 44, border: "1px solid #0E1216", display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em" }}>
                    SEAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 24, fontFamily: MONO, fontSize: 11, color: "#767C83" }}>
          <span>Both artifacts share the same finding_id — cross-referenceable in your audit trail.</span>
        </div>
      </div>
    </section>
  );
}
