import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import { Crosshair } from "@/components/motion/frame";
import { APP_VERSION } from "@/lib/evidence-data";
import { FOOTER } from "@/lib/home-data";

export default function SiteFooter() {
  return (
    <footer className="pm-mk-footer">
      <div className="pm-wrap">
        <div className="pm-mk-footer-marks" aria-hidden="true">
          <Crosshair />
          <Crosshair />
          <Crosshair />
          <Crosshair />
        </div>
        <div className="pm-mk-footer-grid">
          <div className="pm-mk-footer-brand">
            <Wordmark href="/" />
            <p className="pm-t-body pm-mk-mute">Re-checks the arithmetic in PDF statements and shows its work. Built in Bengaluru.</p>
          </div>
          {FOOTER.map((c) => (
            <div key={c.h}>
              <p className="pm-t-label pm-mk-mute pm-mk-footer-h">{c.h}</p>
              <ul className="pm-mk-footer-links">
                {c.links.map((l) =>
                  // Home anchors stay plain <a> ("/#pipeline" works from /security too).
                  l.href.startsWith("/#") ? (
                    <li key={l.href}>
                      <a href={l.href}>{l.label}</a>
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <p className="pm-mk-footer-giant" aria-hidden="true">
          ProofMart
        </p>
        <div className="pm-mk-footer-base">
          <span>© 2026 ProofMart Systems</span>
          <span className="pm-t-mono">v{APP_VERSION} · public beta</span>
        </div>
      </div>
    </footer>
  );
}
