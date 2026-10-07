import EvidenceRail from "@/components/evidence-rail/evidence-rail";
import Frame from "@/components/motion/frame";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import { ScrollVar } from "@/components/motion/scroll-progress";
import SectionKicker from "@/components/home/section-kicker";

const ASSURANCES = ["No account needed", "Deterministic rules, no ML model", "Signed-out uploads deleted after the scan"];

/**
 * The working product, second thing on the page: the sample scan in the
 * Evidence Rail, and the real upload behind it. `#access` is the scroll
 * target every "Start a scan" CTA and SCAN_URL (/?scan=1#access) aim at.
 * The frame tilts back to flat as it enters (bar.md §2).
 */
export default function LiveScanSection() {
  return (
    <section className="pm-mk-section pm-mk-live" aria-labelledby="live-title">
      <div className="pm-wrap">
        <div className="pm-mk-head pm-mk-head-split">
          <div>
            <SectionKicker n="01">Live sample scan</SectionKicker>
            <LineReveal as="h2" id="live-title" className="pm-t-heading-lg">
              Click a finding. <br />
              The page turns to it.
            </LineReveal>
          </div>
          <div className="pm-mk-head-aside">
            <Reveal as="p" className="pm-t-body-lg pm-mk-lead">
              This is the real rail, running a six-page sample. Pin a finding and it opens the page it lives on and boxes the row. Drop your own
              PDF on it and the same engine reads that instead.
            </Reveal>
            <Reveal as="ul" delay={80} className="pm-mk-assure">
              {ASSURANCES.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </Reveal>
          </div>
        </div>

        <ScrollVar range="enter" className="pm-scroll-tilt pm-mk-live-tilt">
          <Frame columns={4} tone="haze" className="pm-mk-live-frame" stageClassName="pm-mk-live-stage" label="Drop a PDF anywhere on the rail">
            <div id="access" className="pm-mk-rail-slot">
              <EvidenceRail />
            </div>
          </Frame>
        </ScrollVar>
      </div>
    </section>
  );
}
