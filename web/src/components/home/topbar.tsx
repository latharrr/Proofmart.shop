import HeaderAuth from "@/components/home/header-auth";
import MobileMenu from "@/components/home/mobile-menu";
import NavLinks from "@/components/home/nav-links";
import Wordmark from "@/components/brand/wordmark";

/**
 * Marketing header: the printed head of the pad, closed by a double rule.
 * Signed out: wordmark · nav · Sign in · Get access. Signed in: wordmark ·
 * nav · New scan · Account (one control holding the email, account links and
 * sign out). Below 1100px the nav and account collapse into Menu.
 *
 * This component is intentionally NOT async and reads no session: keeping it
 * free of cookie reads is what lets the marketing pages prerender and serve
 * from the CDN. The signed-in/out swap happens in HeaderAuth on the client
 * (initial render is the signed-out state, matching the server HTML).
 */
export default function Topbar() {
  return (
    <header className="pm-mk-top">
      <div className="pm-wrap pm-mk-top-inner">
        <Wordmark href="/#main" />
        <NavLinks />
        <div className="pm-mk-top-actions">
          <HeaderAuth layout="bar" />
          <MobileMenu account={<HeaderAuth layout="menu" />} />
        </div>
      </div>
    </header>
  );
}
