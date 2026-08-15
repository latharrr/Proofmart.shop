import { MONO, SANS } from "@/lib/evidence-data";
import { FOOTER } from "@/lib/home-data";

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid #DDE1E4", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "56px 32px 32px" }}>
        <div
          className="pm-footer-grid"
          style={{
            display: "grid",
            gap: 40,
            paddingBottom: 40,
            borderBottom: "1px solid #DDE1E4",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
                <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
              </div>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 17 }}>ProofMart</span>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: "#43494F", maxWidth: "40ch", lineHeight: 1.55 }}>
              Document forensics as a structured evidence graph. Built in Bengaluru.
            </p>
          </div>
          {FOOTER.map((c) => (
            <div key={c.h}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em", marginBottom: 14 }}>{c.h.toUpperCase()}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="pm-hoverable" style={{ fontFamily: SANS, fontSize: 13, color: "#43494F" }}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>
          <span>© 2026 ProofMart Systems · MIT No. 2026/PMT/0041</span>
          <span>v0.9.14 · public beta</span>
        </div>
      </div>
    </footer>
  );
}
