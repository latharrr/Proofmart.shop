import HeaderAuth from "@/components/home/header-auth";
import IstClock from "@/components/home/ist-clock";
import MobileMenu from "@/components/home/mobile-menu";
import NavLinks from "@/components/home/nav-links";
import Wordmark from "@/components/brand/wordmark";

/**
 * Marketing header: one thin bar. Left the wordmark; centre a mono IST clock
 * and the API's version (there is no public health check, so it states the
 * version, never "online"); right the nav, account and "Get API key". On
 * scroll it takes the paper blur and a bottom hairline (CSS scroll timeline).
 *
 * Intentionally NOT async and reads no session, so marketing pages prerender
 * and serve from the CDN. HeaderAuth swaps in signed-in controls on the
 * client (its initial render is the signed-out state, matching the server).
 */
export default function Topbar() {
  return (
    <header className="pm-mk-top">
      <div className="pm-wrap pm-mk-top-inner">
        <Wordmark href="/#main" />
        <div className="pm-mk-status" aria-label="Status">
          <IstClock />
          <span className="pm-mk-api">
            <span className="pm-mk-api-dot" aria-hidden="true" />
            API v1
          </span>
        </div>
        <NavLinks />
        <div className="pm-mk-top-actions">
          <HeaderAuth layout="bar" />
          <MobileMenu account={<HeaderAuth layout="menu" />} />
        </div>
      </div>
      {/* Scroll progress, scaled by the motion layer. */}
      <span className="pm-mk-progress" aria-hidden="true" />
    </header>
  );
}
