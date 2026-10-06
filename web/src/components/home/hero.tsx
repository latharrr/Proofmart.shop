import EvidenceRail from "@/components/evidence-rail/evidence-rail";
import OpenScanButton from "@/components/home/open-scan-button";
import Reveal from "@/components/home/reveal";
import { FINDINGS } from "@/lib/evidence-data";

// The finding on the floating card is the first finding of the sample scan the
// rail itself is showing — same marker, same explanation, same arithmetic — so
// the two artifacts are two views of one document, not two mockups.
const LEAD_FINDING = FINDINGS[0];

const SECTORS = ["Lending", "Verification", "Risk", "Accounting", "Compliance"];

export default function Hero() {
  return (
    <section className="pm-hero">
      <div className="pm-shell">
        <div className="pm-hero-copy">
          <Reveal>
            <p className="pm-eyebrow">Document forensics · API</p>
          </Reveal>
          <Reveal delay={300}>
            <h1 className="pm-display pm-hero-title">
              Every claim{" "}
              <br />
              on a document,{" "}
              <br />
              <em>on the record.</em>
            </h1>
          </Reveal>
          <Reveal delay={600}>
            <p className="pm-lead" style={{ maxWidth: "42ch" }}>
              ProofMart takes a PDF and returns a structured report of findings, each pinned to its pixel, each with the arithmetic. You read the rail,
              not the doc.
            </p>
          </Reveal>
          <Reveal delay={900}>
            <div className="pm-hero-actions">
              <OpenScanButton className="pm-btn pm-btn-filled">Start a scan</OpenScanButton>
              <a href="#run" className="pm-btn pm-btn-ghost">
                Read the response
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/*
        Two floating product artifacts, neither in a frame and both running off
        an edge of the viewport: the rail past the right, the finding card past
        the left. The crop is done by the viewport itself (html/body carry
        `overflow-x: clip`), not by a container drawn to look like one.
      */}
      <Reveal delay={900} className="pm-artifact pm-artifact-finding">
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--pm-fail)" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <span className="pm-mono" style={{ color: "var(--pm-ink)" }}>
            {LEAD_FINDING.marker}
          </span>
          <span
            className="pm-mono"
            style={{
              color: "var(--pm-fail)",
              border: "1px solid var(--pm-fail)",
              borderRadius: "var(--pm-r-pill)",
              padding: "2px 10px",
              whiteSpace: "nowrap",
            }}
          >
            {LEAD_FINDING.verdict}
          </span>
        </div>
        <p className="pm-body" style={{ marginBottom: 12 }}>
          {LEAD_FINDING.explanation}
        </p>
        <pre
          className="pm-mono"
          style={{
            margin: 0,
            padding: 14,
            background: "var(--pm-mist)",
            borderRadius: "var(--pm-r-image)",
            color: "var(--pm-ink)",
            whiteSpace: "pre",
            overflowX: "auto",
            letterSpacing: "0.02em",
          }}
        >
          {LEAD_FINDING.arithmetic}
        </pre>
        <div className="pm-mono" style={{ color: "var(--pm-ash)", marginTop: 10 }}>
          {LEAD_FINDING.addr1} · box {LEAD_FINDING.rect.x},{LEAD_FINDING.rect.y}
        </div>
      </Reveal>

      <Reveal id="access" delay={300} className="pm-artifact pm-artifact-rail" style={{ scrollMarginTop: 96 }}>
        <EvidenceRail />
      </Reveal>

      <div className="pm-shell pm-hero-strip-wrap">
        <Reveal className="pm-hero-strip">
          <span className="pm-eyebrow" style={{ margin: 0, flex: "none" }}>
            Built for
          </span>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
            {SECTORS.map((s) => (
              <li
                key={s}
                className="pm-caption"
                style={{
                  color: "var(--pm-slate)",
                  background: "var(--pm-mist)",
                  borderRadius: "var(--pm-r-pill)",
                  padding: "6px 14px",
                }}
              >
                {s}
              </li>
            ))}
          </ul>
          <a href="#markers" className="pm-link" style={{ flex: "none" }}>
            See the marker catalog
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
