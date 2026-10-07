import EvidenceRail from "@/components/evidence-rail/evidence-rail";
import OpenScanButton from "@/components/home/open-scan-button";
import Reveal from "@/components/home/reveal";
import { FINDINGS } from "@/lib/evidence-data";

// The finding on the floating card is the first finding of the sample scan the
// rail itself is showing — same marker, same explanation, same arithmetic — so
// the two artifacts are two views of one document, not two mockups: the rail
// is what a reviewer sees, the card is what the API hands a developer.
const LEAD_FINDING = FINDINGS[0];

const SECTORS = ["Lending", "Underwriting", "KYC & onboarding", "Risk ops", "Accounting"];

const ASSURANCES = ["No account needed to try", "Deterministic rules, no ML model", "Signed-out uploads are deleted after the scan"];

export default function Hero() {
  return (
    // `id="run"`: older in-app links (/documents' empty state) send people to
    // /#run to verify a document, which is this screen.
    <section id="run" className="pm-hero">
      <div className="pm-shell">
        <div className="pm-hero-copy">
          <Reveal>
            <p className="pm-eyebrow">Document forensics API</p>
          </Reveal>
          <Reveal delay={300}>
            <h1 className="pm-display pm-hero-title">
              See where <br />
              a statement <br />
              <em>stops adding up.</em>
            </h1>
          </Reveal>
          <Reveal delay={600}>
            <p className="pm-lead pm-hero-lead">
              ProofMart re-checks the arithmetic on every row of a PDF statement, pins each break to its box on the page with the sums that prove
              it, and returns one verdict: FAIL, REVIEW or CLEAR.
            </p>
          </Reveal>
          <Reveal delay={900}>
            <div className="pm-hero-actions">
              <OpenScanButton className="pm-btn pm-btn-filled">Start a scan</OpenScanButton>
              <a href="#outputs" className="pm-btn pm-btn-ghost">
                Read the response
              </a>
            </div>
            <ul className="pm-hero-assurances">
              {ASSURANCES.map((a) => (
                <li key={a} className="pm-caption">
                  {a}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>

      {/*
        Two floating product artifacts, neither in a frame. The rail runs past
        the right edge of the viewport and the crop lands in the document
        pane's own padding; the finding card overlaps the rail's lower-left
        corner (it comes first in the DOM so that, stacked on a phone, the
        evidence is on the first screen). The crop is done by the viewport itself (html/body carry
        `overflow-x: clip`), not by a container drawn to look like one.
      */}
      <Reveal delay={900} className="pm-artifact pm-artifact-finding">
        <div aria-hidden="true" className="pm-finding-edge" />
        <div className="pm-finding-head">
          <span className="pm-mono" style={{ color: "var(--pm-ink)" }}>
            {LEAD_FINDING.marker}
          </span>
          <span className="pm-mono pm-verdict-pill" style={{ color: "var(--pm-fail)", borderColor: "var(--pm-fail)" }}>
            × {LEAD_FINDING.verdict}
          </span>
        </div>
        <p className="pm-body" style={{ margin: "0 0 12px" }}>
          {LEAD_FINDING.explanation}
        </p>
        <pre className="pm-mono pm-finding-math">{LEAD_FINDING.arithmetic}</pre>
        <div className="pm-mono" style={{ color: "var(--pm-ash)", marginTop: 12 }}>
          findings[0] · page 4 · rect {LEAD_FINDING.rect.x},{LEAD_FINDING.rect.y},{LEAD_FINDING.rect.w},{LEAD_FINDING.rect.h}
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
          <ul className="pm-hero-sectors">
            {SECTORS.map((s) => (
              <li key={s} className="pm-caption">
                {s}
              </li>
            ))}
          </ul>
          <a href="#markers" className="pm-link pm-caption" style={{ flex: "none" }}>
            What it checks
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
