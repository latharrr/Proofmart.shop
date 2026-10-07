import AuthControls from "@/components/home/auth-controls";
import MobileMenu from "@/components/home/mobile-menu";
import NavLinks from "@/components/home/nav-links";
import OpenScanButton from "@/components/home/open-scan-button";
import Wordmark from "@/components/brand/wordmark";
import { APP_VERSION } from "@/lib/evidence-data";

export default async function Topbar() {
  return (
    <header className="pm-topbar">
      <div className="pm-shell pm-topbar-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <Wordmark href="/#main" />
          <span className="pm-mono pm-topbar-version">v{APP_VERSION}</span>
        </div>
        <NavLinks />
        <div className="pm-topbar-actions">
          <div className="pm-topbar-auth">
            <AuthControls />
          </div>
          <OpenScanButton className="pm-btn pm-btn-filled pm-btn-sm">Get access</OpenScanButton>
          <MobileMenu account={<AuthControls layout="menu" />} />
        </div>
      </div>
    </header>
  );
}
