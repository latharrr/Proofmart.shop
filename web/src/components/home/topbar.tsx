import Link from "next/link";
import AuthControls from "@/components/home/auth-controls";
import MobileMenu from "@/components/home/mobile-menu";
import NavLinks from "@/components/home/nav-links";
import OpenScanButton from "@/components/home/open-scan-button";
import Wordmark from "@/components/brand/wordmark";
import { APP_VERSION } from "@/lib/evidence-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function Topbar() {
  // Same check AuthControls makes: a missing Supabase config degrades to the
  // signed-out header instead of crashing every page.
  const signedIn = isSupabaseConfigured() ? Boolean((await (await createClient()).auth.getClaims()).data?.claims) : false;

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
          {/* The header CTA grants access, so it goes where access is granted:
              an account. Signed in, the account links sit beside it already,
              so it becomes the next useful action instead. */}
          {signedIn ? (
            <OpenScanButton className="pm-btn pm-btn-filled pm-btn-sm">New scan</OpenScanButton>
          ) : (
            <Link href="/signup" className="pm-btn pm-btn-filled pm-btn-sm">
              Get access
            </Link>
          )}
          <MobileMenu account={<AuthControls layout="menu" />} />
        </div>
      </div>
    </header>
  );
}
