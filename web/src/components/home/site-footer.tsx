import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import { APP_VERSION } from "@/lib/evidence-data";
import { FOOTER } from "@/lib/home-data";

export default function SiteFooter() {
  return (
    <footer className="pm-band-fog">
      <div className="pm-shell" style={{ paddingTop: 64, paddingBottom: 32 }}>
        <div className="pm-footer-grid" style={{ paddingBottom: 40, borderBottom: "1px solid var(--pm-hairline)" }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <Wordmark href="/" />
            </div>
            <p className="pm-body" style={{ color: "var(--pm-slate)", maxWidth: "36ch" }}>
              Re-checks the arithmetic in PDF statements and shows its work. Built in Bengaluru.
            </p>
          </div>
          {FOOTER.map((c) => (
            <div key={c.h}>
              <p className="pm-eyebrow" style={{ marginBottom: 14 }}>
                {c.h}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {c.links.map((l) =>
                  // Home-page anchors stay plain <a>: they are written "/#pipeline"
                  // so they work from /security too, and a plain link lets the
                  // browser do an ordinary same-document jump on the home page.
                  l.href.startsWith("/#") ? (
                    <li key={l.href}>
                      <a href={l.href} className="pm-nav-link">
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link href={l.href} className="pm-nav-link">
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            color: "var(--pm-ash)",
          }}
        >
          <span className="pm-caption">© 2026 ProofMart Systems · MIT No. 2026/PMT/0041</span>
          <span className="pm-mono">v{APP_VERSION} · public beta</span>
        </div>
      </div>
    </footer>
  );
}
