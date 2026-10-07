import HeroStage from "@/components/home/hero-stage";
import OpenScanButton from "@/components/home/open-scan-button";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import { SAMPLE_FINDINGS } from "@/components/evidence-rail/sample-statement";

// The finding on the proof card is the sample scan's first finding — the same
// row the 3D page has boxed, and the one the live rail below opens pinned —
// so the scene, the card and the rail are three views of one document.
const LEAD = SAMPLE_FINDINGS[0];

export default function Hero() {
  return (
    // `id="run"`: older in-app links send people to /#run to verify a document.
    <section id="run" className="pm-mk-hero" aria-labelledby="hero-title">
      <div className="pm-wrap">
        <HeroStage
          overlay={
            <Reveal delay={700} className="pm-mk-proof" aria-label="The finding behind the verdict">
              <div className="pm-mk-proof-head">
                <span className="pm-mk-verdict" data-tone="FAIL">
                  <span aria-hidden="true">×</span>FAIL
                </span>
                <span className="pm-mk-proof-id">{LEAD.marker}</span>
                <span className="pm-mk-proof-addr">p4 · r17</span>
              </div>
              <p className="pm-mk-proof-body">{LEAD.explanation}</p>
              <pre className="pm-mk-proof-math">{LEAD.arithmetic}</pre>
              <a href="#access" className="pm-inline-link pm-mk-proof-link">
                See it pinned in the live scan
              </a>
            </Reveal>
          }
        >
          <p className="pm-t-label pm-mk-hero-kicker">
            <span className="pm-mk-kdot" aria-hidden="true" />
            Document forensics API
          </p>
          <LineReveal as="h1" id="hero-title" className="pm-t-display pm-mk-hero-title" delay={120}>
            Find the <br />
            row that <br />
            lies.
          </LineReveal>
          <Reveal as="p" delay={360} className="pm-t-body-lg pm-mk-hero-lead">
            ProofMart re-adds every row of a PDF bank statement, pins each break to its box on the page with the sums that prove it, and returns
            one verdict: FAIL, REVIEW or CLEAR.
          </Reveal>
          <Reveal delay={480} className="pm-mk-hero-actions">
            <OpenScanButton variant="paper">Start a scan</OpenScanButton>
            <RollPill href="#outputs" native variant="secondary" className="pm-mk-pill-glass">
              Read the response
            </RollPill>
          </Reveal>
        </HeroStage>
      </div>
    </section>
  );
}
