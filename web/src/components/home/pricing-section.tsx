import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import Tilt from "@/components/motion/tilt";
import SectionKicker from "@/components/home/section-kicker";
import { PRICING } from "@/lib/home-data";

export default function PricingSection() {
  return (
    <section id="pricing" className="pm-mk-section pm-mk-pricing" aria-labelledby="pricing-title">
      <div className="pm-wrap">
        <div className="pm-mk-head pm-mk-head-split">
          <div>
            <SectionKicker n="06">Pricing</SectionKicker>
            <LineReveal as="h2" id="pricing-title" className="pm-t-heading-lg">
              Flat monthly. <br />
              No per-page metering.
            </LineReveal>
          </div>
          <div className="pm-mk-head-aside">
            <Reveal as="p" className="pm-t-body-lg pm-mk-lead">
              Start free with the full engine. Upgrade when your team runs ProofMart inside a review or underwriting loop.
            </Reveal>
          </div>
        </div>

        <div className="pm-mk-plans">
          {PRICING.map((p, i) => {
            const pro = p.highlight === true;
            return (
              <Reveal key={p.tier} delay={i * 80} className="pm-mk-plan-wrap">
                <Tilt max={4} className="pm-mk-plan-tilt">
                  <article className="pm-mk-plan" data-pro={pro ? "" : undefined}>
                    <div className="pm-mk-plan-top">
                      <span className="pm-t-label">{p.tier}</span>
                      {pro && (
                        <span className="pm-t-label pm-mk-plan-tag">
                          <span className="pm-mk-kdot" aria-hidden="true" />
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="pm-mk-plan-price">
                      <span className="pm-t-heading-lg">{p.price}</span>
                      <span className="pm-t-body pm-mk-plan-unit">{p.unit}</span>
                    </div>
                    <p className="pm-t-body pm-mk-plan-body">{p.body}</p>
                    <ul className="pm-mk-plan-list">
                      {p.included.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                    <RollPill href="/signup" variant={pro ? "paper" : "primary"} dot={pro} className="pm-mk-plan-cta">
                      {p.cta}
                    </RollPill>
                  </article>
                </Tilt>
              </Reveal>
            );
          })}
        </div>

        <p className="pm-mk-note">
          Prices in INR, billed monthly. A call is one <span className="pm-t-mono">/v1/verify</span> request, whatever the page count. Every key is
          also rate-limited to 60 requests a minute on both plans.
        </p>
      </div>
    </section>
  );
}
