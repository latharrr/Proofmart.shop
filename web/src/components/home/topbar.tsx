import AuthControls from "@/components/home/auth-controls";
import NavLinks from "@/components/home/nav-links";
import OpenScanButton from "@/components/home/open-scan-button";
import Wordmark from "@/components/brand/wordmark";
import { APP_VERSION } from "@/lib/evidence-data";

export default async function Topbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "saturate(1.1) blur(12px)",
        WebkitBackdropFilter: "saturate(1.1) blur(12px)",
        borderBottom: "1px solid var(--pm-hairline)",
      }}
    >
      <div
        className="pm-shell"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, paddingTop: 14, paddingBottom: 14 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <Wordmark href="/#main" />
          <span
            className="pm-mono pm-topbar-version"
            style={{ color: "var(--pm-ash)", background: "var(--pm-mist)", borderRadius: "var(--pm-r-pill)", padding: "3px 10px", whiteSpace: "nowrap" }}
          >
            v{APP_VERSION}
          </span>
        </div>
        <NavLinks />
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "none" }}>
          <AuthControls />
          <OpenScanButton className="pm-btn pm-btn-filled pm-btn-sm">Get access</OpenScanButton>
        </div>
      </div>
    </header>
  );
}
