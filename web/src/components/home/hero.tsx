import EvidenceRail from "@/components/evidence-rail/evidence-rail";
import OpenScanButton from "@/components/home/open-scan-button";
import { MONO, SANS } from "@/lib/evidence-data";

export default function Hero() {
  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "72px 32px 40px" }}>
      <div className="pm-hero-grid" style={{ display: "grid", gap: 56, alignItems: "end" }}>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: MONO,
              fontSize: 11,
              color: "#767C83",
              letterSpacing: "0.08em",
              marginBottom: 24,
            }}
          >
            <span aria-hidden="true" style={{ width: 6, height: 6, background: "#B4231F", display: "inline-block" }} />
            DOCUMENT FORENSICS · API
          </div>
          <h1
            className="pm-hero-title"
            style={{
              fontFamily: SANS,
              fontWeight: 500,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              margin: "0 0 24px",
              textWrap: "pretty",
            }}
          >
            Every claim
            <br />
            on a document,
            <br />
            <span style={{ color: "#43494F" }}>on the record.</span>
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.55, color: "#43494F", maxWidth: "44ch", margin: "0 0 32px" }}>
            ProofMart takes a PDF and returns a structured report of findings, each pinned to its pixel, each with the arithmetic. You read the rail,
            not the doc.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
            <OpenScanButton
              className="pm-hoverable"
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: "0.06em",
                padding: "12px 18px",
                background: "#0E1216",
                color: "#F5F5F0",
                borderRadius: 3,
              }}
            >
              START A SCAN →
            </OpenScanButton>
            <a
              href="#run"
              className="pm-hoverable"
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: "0.06em",
                padding: "12px 18px",
                border: "1px solid #DDE1E4",
                color: "#0E1216",
                borderRadius: 3,
              }}
            >
              READ THE RESPONSE
            </a>
          </div>
          <div style={{ paddingTop: 22, borderTop: "1px solid #DDE1E4", maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.16em" }}>SAMPLE SCAN · REQ_8FK2</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.06em" }}>reads from the rail →</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: 32 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em", marginBottom: 6 }}>DOCUMENT</div>
                <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500 }}>
                  6<span style={{ fontFamily: MONO, fontSize: 13, color: "#767C83", fontWeight: 400, marginLeft: 4 }}>pages</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em", marginBottom: 6 }}>FINDINGS</div>
                <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500 }}>
                  4<span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", fontWeight: 400, marginLeft: 6, letterSpacing: "0.04em" }}>
                    2 FAIL · 2 REVIEW
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em", marginBottom: 6 }}>VERDICT</div>
                <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color: "#B4231F" }}>× FAIL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live rail */}
        <div id="access" style={{ position: "relative", scrollMarginTop: 80 }}>
          <div
            style={{
              position: "absolute",
              top: -22,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: MONO,
              fontSize: 10,
              color: "#767C83",
              letterSpacing: "0.1em",
            }}
          >
            <span>REQ_8FK2 · LIVE</span>
            <span>DRAG A PDF ONTO THE RAIL ↓</span>
          </div>
          <div className="pm-hero-rail" style={{ boxShadow: "0 24px 60px -30px rgba(14,18,22,0.35)" }}>
            <EvidenceRail />
          </div>
        </div>
      </div>

      {/* Category strip — factual, no fabricated customers */}
      <div style={{ marginTop: 72, paddingTop: 22, borderTop: "1px solid #DDE1E4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.14em" }}>BUILT FOR</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: "#0E1216", letterSpacing: "0.2em" }}>
            LENDING &nbsp;·&nbsp; VERIFICATION &nbsp;·&nbsp; RISK &nbsp;·&nbsp; ACCOUNTING &nbsp;·&nbsp; COMPLIANCE
          </div>
        </div>
      </div>
    </section>
  );
}
