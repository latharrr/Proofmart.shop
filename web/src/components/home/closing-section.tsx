import Link from "next/link";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import DepthStage from "@/components/home/depth-stage";
import OpenScanButton from "@/components/home/open-scan-button";
import SectionKicker from "@/components/home/section-kicker";

// The four answers a buyer's security reviewer asks for first, each one a
// claim /security backs in detail.
const SECURITY_POINTS = [
  { k: "Storage", v: "Private blob store. No public URLs; reads need a server-held credential.", href: "/security#storage" },
  { k: "Access", v: "Row Level Security on every table. You only ever see your own rows.", href: "/security#access" },
  { k: "Retention", v: "Signed-out uploads are deleted after the scan. Saved ones stay until you delete them.", href: "/security#retention" },
  { k: "Processing", v: "Parsing and OCR run inside ProofMart. No document goes to a third-party AI.", href: "/security#processing" },
];

export default function ClosingSection() {
  return (
    <section id="start" className="pm-mk-section pm-mk-closing" aria-labelledby="closing-title">
      <div className="pm-wrap">
        <DepthStage
          variant="hero"
          className="pm-mk-closing-stage"
          label="Your statement next"
          sceneLabel="Three statement pages fanned out, the examined one boxed and tagged FAIL."
        >
          <div className="pm-mk-closing-copy">
            <SectionKicker n="07" tone="dark">
              Start
            </SectionKicker>
            <LineReveal as="h2" id="closing-title" className="pm-t-heading-lg">
              Run it on a statement <br />
              you already doubt.
            </LineReveal>
            <Reveal as="p" delay={120} className="pm-t-body-lg pm-mk-closing-lead">
              The live scan takes a real PDF. No account, and the file is deleted when the scan finishes.
            </Reveal>
            <Reveal delay={200} className="pm-mk-hero-actions">
              <OpenScanButton variant="paper">Scan a document</OpenScanButton>
              <RollPill href="/signup" variant="secondary" className="pm-mk-pill-glass">
                Create an account
              </RollPill>
            </Reveal>
          </div>
        </DepthStage>

        <div className="pm-mk-sec-strip">
          <div className="pm-mk-sec-strip-head">
            <p className="pm-t-label pm-mk-mute">For your security review</p>
            <Link href="/security" className="pm-inline-link">
              Read how documents are handled
            </Link>
          </div>
          <dl className="pm-mk-sec-points">
            {SECURITY_POINTS.map((p, i) => (
              <Reveal key={p.k} delay={i * 80} className="pm-mk-sec-point">
                <dt className="pm-t-heading-sm">
                  <Link href={p.href}>{p.k}</Link>
                </dt>
                <dd className="pm-t-body pm-mk-mute">{p.v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
