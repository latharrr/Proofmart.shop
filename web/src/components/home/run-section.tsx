import Reveal from "@/components/home/reveal";

const STEPS = [
  {
    step: "Step 01 · Send",
    title: "One multipart POST.",
    body: "Files up to 50 pages, 20 MB. Timeout 30 s.",
  },
  {
    step: "Step 02 · Receive",
    title: "The full evidence graph.",
    body: "Every finding carries page, box, expected/found and marker id: every value points back to a rail address you can screenshot.",
  },
  {
    step: "Step 03 · Decide",
    title: "Deterministic, not guessed.",
    body: "No LLM, no scoring model. A fixed precedence — FAIL beats REVIEW beats CLEAR — turns findings into one verdict, every time.",
  },
];

// The terminal is a content card, so it carries no shadow and no syntax
// rainbow: the only saturated colour in it is the verdict, which is the one
// thing in the transcript that actually means something.
const DIM = { color: "var(--pm-smoke)" };
const FAIL = { color: "var(--pm-fail)" };
const REVIEW = { color: "var(--pm-review)" };

export default function RunSection() {
  return (
    <section id="run" className="pm-band-paper">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">§ 04 · Run</p>
            <h2 className="pm-h2">One call. One structured response.</h2>
          </div>
          <p className="pm-lead">
            The API is small on purpose. Send a PDF; receive the same finding graph you inspected on the rail. Every field maps back to a rail address.
          </p>
        </Reveal>

        <div className="pm-run-grid">
          <Reveal style={{ background: "var(--pm-ink)", borderRadius: "var(--pm-r-card)", overflow: "hidden" }}>
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
                terminal · sample
              </span>
              <span className="pm-mono" style={{ color: "var(--pm-smoke)" }}>
                req_8fk2
              </span>
            </div>
            <pre
              className="pm-mono"
              style={{ margin: 0, padding: "20px", lineHeight: 1.75, color: "var(--pm-paper)", overflowX: "auto", letterSpacing: "0.02em" }}
            >
              {"$ curl "}
              <span style={DIM}>https://proofmart.shop/v1/verify</span>
              {" \\\n    -H "}
              <span style={DIM}>&quot;Authorization: Bearer $PROOFMART_API_KEY&quot;</span>
              {" \\\n    -F "}
              <span style={DIM}>&quot;file=@hdfc_apr25.pdf&quot;</span>
              {"\n\n"}
              <span style={DIM}>↳ 4.8s · verification returned inline · sample</span>
              {"\n"}
              <span style={FAIL}>× FAIL</span>
              {" · req_8fk2 · 4 findings\n   "}
              <span style={FAIL}>×</span>
              {" BALANCE_BREAK             p4·r17\n   "}
              <span style={FAIL}>×</span>
              {" CROSS_PAGE_TOTAL_MISMATCH p3→p4\n   "}
              <span style={REVIEW}>~</span>
              {" DUPLICATE_TRANSACTION     p2·r04\n   "}
              <span style={REVIEW}>~</span>
              {" OCR_LOW_CONFIDENCE        p4·r14"}
            </pre>
          </Reveal>

          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={(i + 1) * 300} className="pm-card">
                <p className="pm-eyebrow" style={{ marginBottom: 8 }}>
                  {s.step}
                </p>
                <p className="pm-h3" style={{ marginBottom: 8 }}>
                  {s.title}
                </p>
                <p className="pm-body" style={{ color: "var(--pm-slate)" }}>
                  {s.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
