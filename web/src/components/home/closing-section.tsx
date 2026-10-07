import Link from "next/link";
import OpenScanButton from "@/components/home/open-scan-button";
import Reveal from "@/components/home/reveal";

// The four answers a buyer's security reviewer asks for first, each one a
// claim /security backs in detail.
const SECURITY_POINTS = [
  { k: "Storage", v: "Private blob store. No public URLs; reads need a server-held credential." },
  { k: "Access", v: "Row Level Security on every table — you only ever see your own rows." },
  { k: "Retention", v: "Signed-out uploads are deleted after the scan. Saved ones stay until you delete them." },
  { k: "Processing", v: "Parsing and OCR run inside ProofMart. No document goes to a third-party AI." },
];

export default function ClosingSection() {
  return (
    <section id="start" className="pm-band-fog">
      <div className="pm-shell pm-section pm-closing">
        <Reveal className="pm-closing-cta">
          <h2 className="pm-h2">Run it on a statement you already doubt.</h2>
          <p className="pm-lead" style={{ marginTop: 20, maxWidth: "36ch" }}>
            The rail at the top of this page takes a real PDF. No account, and the file is deleted when the scan finishes.
          </p>
          <div className="pm-hero-actions">
            <OpenScanButton className="pm-btn pm-btn-filled">Scan a document</OpenScanButton>
            <Link href="/signup" className="pm-btn pm-btn-ghost">
              Create an account
            </Link>
          </div>
        </Reveal>

        <Reveal delay={300} className="pm-closing-security">
          <p className="pm-eyebrow" style={{ marginBottom: 12 }}>
            For your security review
          </p>
          <dl>
            {SECURITY_POINTS.map((p) => (
              <div key={p.k} className="pm-closing-row">
                <dt className="pm-body" style={{ fontWeight: 450 }}>
                  {p.k}
                </dt>
                <dd className="pm-caption" style={{ color: "var(--pm-slate)", margin: 0 }}>
                  {p.v}
                </dd>
              </div>
            ))}
          </dl>
          <Link href="/security" className="pm-link" style={{ marginTop: 20 }}>
            Read how documents are handled
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
