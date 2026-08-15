import { MONO, SANS } from "@/lib/evidence-data";

const NAV_LINKS = [
  { href: "#pipeline", label: "Pipeline" },
  { href: "#markers", label: "Markers" },
  { href: "#run", label: "Run" },
  { href: "#outputs", label: "Outputs" },
  { href: "#integrate", label: "Integrate" },
  { href: "#pricing", label: "Pricing" },
];

export default function Topbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(1.2) blur(10px)",
        WebkitBackdropFilter: "saturate(1.2) blur(10px)",
        borderBottom: "1px solid #DDE1E4",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17 }}>ProofMart</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.06em", marginLeft: 4 }}>V0.9 BETA</span>
        </div>
        <nav aria-label="Primary" className="pm-nav-links" style={{ alignItems: "center", gap: 28, fontFamily: SANS, fontSize: 14, color: "#43494F" }}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="pm-hoverable" style={{ color: "#43494F" }}>
              {l.label}
            </a>
          ))}
          <a href="#docs" className="pm-hoverable" style={{ fontFamily: MONO, fontSize: 12, color: "#767C83" }}>
            docs ↗
          </a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="#signin" className="pm-hoverable" style={{ fontFamily: SANS, fontSize: 14, color: "#43494F" }}>
            Sign in
          </a>
          <a
            href="#access"
            className="pm-hoverable"
            style={{
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.04em",
              padding: "8px 12px",
              background: "#0E1216",
              color: "#F5F5F0",
              borderRadius: 3,
            }}
          >
            GET ACCESS →
          </a>
        </div>
      </div>
    </header>
  );
}
