import { MONO, SANS } from "@/lib/evidence-data";

const STEPS = [
  {
    step: "STEP 01 · SEND",
    title: "One multipart POST.",
    body: "Files up to 50 pages, 20 MB. Timeout 30 s.",
  },
  {
    step: "STEP 02 · RECEIVE",
    title: "The full evidence graph.",
    body: "Every finding carries page, box, expected/found, marker id: every value points back to the rail address you can screenshot.",
  },
  {
    step: "STEP 03 · DECIDE",
    title: "Deterministic, not guessed.",
    body: "No LLM, no scoring model. A fixed precedence, FAIL beats REVIEW beats CLEAR, turns findings into one verdict, every time.",
  },
];

export default function RunSection() {
  return (
    <section id="run" style={{ borderTop: "1px solid #DDE1E4", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "88px 32px" }}>
        <div
          className="pm-split-grid-48"
          style={{
            display: "grid",
            gap: 56,
            alignItems: "start",
            marginBottom: 40,
          }}
        >
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em", marginBottom: 12 }}>§ 04 · RUN</div>
            <h2 className="pm-h2" style={{ fontFamily: SANS, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 16px" }}>
              One call.
              <br />
              One structured response.
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.55, color: "#43494F", maxWidth: "62ch", margin: "8px 0 0" }}>
            The API is small on purpose. Send a PDF; receive the same finding graph you inspected on the rail. Every field maps back to a rail
            address.
          </p>
        </div>

        <div className="pm-run-grid" style={{ display: "grid", gap: 20, alignItems: "start" }}>
          <div style={{ background: "#0E1216", color: "#E5E7EA", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #2A2F35" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.08em" }}>$ TERMINAL · SAMPLE</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83" }}>req_8fk2</span>
            </div>
            <pre style={{ margin: 0, padding: "22px 20px", fontFamily: MONO, fontSize: 12, lineHeight: 1.75, color: "#F5F5F0", overflowX: "auto" }}>
              {"$ curl "}
              <span style={{ color: "#A9BFD8" }}>https://proofmart.shop/v1/verify</span>
              {" \\\n    -H "}
              <span style={{ color: "#E2C48A" }}>&quot;Authorization: Bearer $PROOFMART_API_KEY&quot;</span>
              {" \\\n    -F "}
              <span style={{ color: "#E2C48A" }}>&quot;file=@hdfc_apr25.pdf&quot;</span>
              {"\n\n"}
              <span style={{ color: "#767C83" }}>↳ 4.8s · verification returned inline · SAMPLE</span>
              {"\n"}
              <span style={{ color: "#E38A82" }}>✗ FAIL</span>
              {" · req_8fk2 · 4 findings\n   "}
              <span style={{ color: "#E38A82" }}>×</span>
              {" BALANCE_BREAK             p4·r17\n   "}
              <span style={{ color: "#E38A82" }}>×</span>
              {" CROSS_PAGE_TOTAL_MISMATCH p3→p4\n   "}
              <span style={{ color: "#F2B04B" }}>~</span>
              {" DUPLICATE_TRANSACTION     p2·r04\n   "}
              <span style={{ color: "#F2B04B" }}>~</span>
              {" OCR_LOW_CONFIDENCE        p4·r14"}
            </pre>
          </div>

          <div style={{ display: "grid", gridTemplateRows: "repeat(3, auto)", gap: 12, alignContent: "start" }}>
            {STEPS.map((s) => (
              <div key={s.step} style={{ background: "#FFFFFF", border: "1px solid #DDE1E4", padding: "20px 22px" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.14em", marginBottom: 6 }}>{s.step}</div>
                <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: "#43494F", lineHeight: 1.55 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
