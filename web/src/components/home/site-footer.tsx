import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import IstClock from "@/components/home/ist-clock";
import { APP_VERSION } from "@/lib/evidence-data";
import { FOOTER } from "@/lib/home-data";

/** The foot of every marketing page: four mono columns, the clock, the build, and a way back up. */
export default function SiteFooter() {
  return (
    <footer className="pm-footer">
      <div className="pm-wrap">
        <div className="pm-footer-grid">
          <div className="pm-footer-brand">
            <Wordmark href="/" />
            <p>Re-checks the arithmetic in PDF statements and shows its work.</p>
          </div>
          {FOOTER.map((c) => (
            <div key={c.h}>
              <p className="pm-footer-h">{c.h}</p>
              <ul className="pm-footer-links">
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
        <div className="pm-footer-base">
          <span>© 2026 Deepanshu Labs · Made in India</span>
          <IstClock />
          <span>
            build v{APP_VERSION} · public beta
          </span>
          <a href="#main" className="pm-footer-top">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
