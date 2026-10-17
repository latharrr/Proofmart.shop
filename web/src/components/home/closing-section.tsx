import Link from "next/link";
import RollPill from "@/components/motion/roll-pill";
import OpenScanButton from "@/components/home/open-scan-button";
import { APP_VERSION } from "@/lib/evidence-data";
import { MARKERS } from "@/lib/home-data";

// The four answers a buyer's security reviewer asks for first, each one a
// claim /security backs in detail.
const SECURITY_POINTS = [
  {
    k: "Storage",
    v: "Private blob store. No public URLs; reads need a server-held credential.",
    href: "/security#storage",
  },
  {
    k: "Access",
    v: "Row Level Security on every table. You only ever see your own rows.",
    href: "/security#access",
  },
  {
    k: "Retention",
    v: "Signed-out uploads are deleted after the scan. Saved ones stay until you delete them.",
    href: "/security#retention",
  },
  {
    k: "Processing",
    v: "Parsing and OCR run inside ProofMart. No document goes to a third-party AI.",
    href: "/security#processing",
  },
];

/**
 * The close: the invitation to bring a real statement, the sheet's sign-off
 * block, and the security answers set out as a short schedule for whoever
 * has to approve the purchase.
 */
export default function ClosingSection() {
  return (
    <section
      id="start"
      className="pm-h-section pm-h-closing"
      aria-labelledby="closing-title"
    >
      <div className="pm-wrap">
        <div className="pm-h-closing-grid">
          <div className="pm-h-closing-copy">
            <h2 id="closing-title" className="pm-h-closing-title">
              Run it on a statement you already doubt.
            </h2>
            <p className="pm-h-lead">
              The live scan takes a real PDF. No account, and the file is
              deleted when the scan finishes.
            </p>
            <div className="pm-h-actions">
              <OpenScanButton>Scan a document</OpenScanButton>
              <RollPill href="/signup" variant="secondary">
                Create an account
              </RollPill>
            </div>
          </div>
          {/* The foot of every working paper: who prepared it, and a line for
            the person who reviews it. ProofMart prepares; the reader signs. */}
          <div className="pm-signoff" aria-label="Sign-off">
            <div>
              <span className="pm-label">Prepared by</span>
              <span>
                ProofMart engine <span className="pm-mono">v{APP_VERSION}</span>
              </span>
            </div>
            <div>
              <span className="pm-label">Checks run</span>
              <span>
                <span className="pm-mono">{MARKERS.length}</span> markers, every
                balance re-added
              </span>
            </div>
            <div className="pm-signoff-line">
              <span className="pm-label">Reviewed by</span>
              <span className="pm-signoff-blank">you</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pm-wrap">
        <div className="pm-h-sec">
          <div className="pm-h-sec-head">
            <h3>For your security review</h3>
            <Link href="/security" className="pm-link">
              Read how documents are handled
            </Link>
          </div>
          <dl>
            {SECURITY_POINTS.map((p) => (
              <div key={p.k}>
                <dt>
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
