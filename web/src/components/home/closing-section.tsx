import Link from "next/link";
import RollPill from "@/components/motion/roll-pill";
import RunSampleButton from "@/components/home/run-sample-button";
import { Serif } from "@/components/home/section-head";

// The four answers a buyer's security reviewer asks for first, each one a
// claim /security backs in detail.
const SECURITY_POINTS = [
  { k: "Storage", v: "Private blob store. No public URLs; reads need a server-held credential.", href: "/security#storage" },
  { k: "Access", v: "Row Level Security on every table. You only ever see your own rows.", href: "/security#access" },
  { k: "Retention", v: "Signed-out uploads are deleted after the scan. Saved ones stay until you delete them.", href: "/security#retention" },
  { k: "Processing", v: "Parsing and OCR run inside ProofMart. No document goes to a third-party AI.", href: "/security#processing" },
];

/**
 * The close, inverted: the one line at display size, the two ways forward,
 * and the security answers as a short index for whoever approves the buy.
 */
/** A faint wall of SAMPLE page sketches behind the close; a box lights on each now and then (CSS, staggered by index). */
function Thumbs() {
  return (
    <div className="pm-close-thumbs" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <svg key={i} viewBox="0 0 64 80" style={{ ["--i" as string]: i }}>
          <rect x="0.5" y="0.5" width="63" height="79" />
          <path d="M8 12h30M8 20h48M8 27h48M8 34h48M8 41h48M8 48h48M8 55h48M8 62h40" />
          <rect className="pm-close-thumb-box" x="6" y={18 + ((i * 7) % 6) * 7} width="52" height="5" />
        </svg>
      ))}
    </div>
  );
}

export default function ClosingSection() {
  return (
    <section id="start" className="pm-section pm-invert pm-close" aria-labelledby="closing-title">
      {/* The ink ground, wiped in from the CTA by the scroll layer. */}
      <div className="pm-close-bg" aria-hidden="true" />
      <Thumbs />
      <div className="pm-wrap">
        <p className="pm-index" data-leader="">
          <span className="pm-index-n">[08]</span>
          <span className="pm-index-dash" aria-hidden="true">
            —
          </span>
          <span className="pm-index-label">Start</span>
          <span className="pm-index-leader" aria-hidden="true" />
          <span className="pm-index-meta">No account needed for the sample</span>
        </p>
        <h2 id="closing-title" className="pm-close-title">
          <span className="pm-mask">
            <span>Same bytes.</span>
          </span>{" "}
          <span className="pm-mask">
            <span>
              Same{" "}
              <span className="pm-close-serif">
                <Serif>verdict.</Serif>
              </span>
            </span>
          </span>
        </h2>
        <div className="pm-close-row">
          <p className="pm-close-lead" data-reveal="">
            Run it on a statement you already doubt. The live scan takes a real PDF, and a signed-out file is deleted when the scan finishes.
          </p>
          <div className="pm-actions">
            <span data-magnetic="">
              <RollPill href="/signup" dot className="pm-close-cta">
                Get API key
              </RollPill>
            </span>
            <RunSampleButton variant="secondary">Run the sample</RunSampleButton>
          </div>
        </div>

        <div className="pm-close-sec">
          <div className="pm-close-sec-head">
            <h3>For your security review</h3>
            <Link href="/security" className="pm-link">
              How documents are handled
            </Link>
          </div>
          <dl>
            {SECURITY_POINTS.map((p, i) => (
              <div key={p.k}>
                <dt>
                  <span className="pm-mono">{String(i + 1).padStart(2, "0")}</span>
                  <Link href={p.href}>{p.k}</Link>
                </dt>
                <dd>{p.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
