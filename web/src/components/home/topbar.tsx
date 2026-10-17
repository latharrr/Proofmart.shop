import AuthControls, { getSessionClaims } from "@/components/home/auth-controls";
import MobileMenu from "@/components/home/mobile-menu";
import NavLinks from "@/components/home/nav-links";
import OpenScanButton from "@/components/home/open-scan-button";
import RollPill from "@/components/motion/roll-pill";
import Wordmark from "@/components/brand/wordmark";

/**
 * Marketing header: the printed head of the pad, closed by a double rule.
 * Signed out: wordmark · nav · Sign in · Get access. Signed in: wordmark ·
 * nav · New scan · Account (one control holding the email, account links and
 * sign out). Below 1100px the nav and account collapse into Menu.
 */
export default async function Topbar() {
  const signedIn = Boolean(await getSessionClaims());

  return (
    <header className="pm-mk-top" data-signed-in={signedIn ? "" : undefined}>
      <div className="pm-wrap pm-mk-top-inner">
        <Wordmark href="/#main" />
        <NavLinks />
        <div className="pm-mk-top-actions">
          <div className="pm-mk-top-auth">
            <AuthControls />
          </div>
          {/* Signed out, the header CTA grants access; signed in, the account
              is already there, so it becomes the next useful action. */}
          {signedIn ? (
            <OpenScanButton size="sm" className="pm-mk-top-cta">
              New scan
            </OpenScanButton>
          ) : (
            <RollPill href="/signup" size="sm" dot className="pm-mk-top-cta">
              Get access
            </RollPill>
          )}
          <MobileMenu account={<AuthControls layout="menu" />} />
        </div>
      </div>
    </header>
  );
}
