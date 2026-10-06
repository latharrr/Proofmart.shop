import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";

export default function NotFound() {
  return (
    <div className="pm-page">
      <Topbar />
      <main id="main">
        <div className="pm-shell" style={{ paddingTop: 120, paddingBottom: 160 }}>
          {/* INCONCLUSIVE is the right register for a 404: the address was
              read, nothing was found there, and that is not a failure of the
              document. Rendered in slate rather than a verdict colour —
              a missing page is not a verdict about anyone's document. */}
          <p className="pm-eyebrow">404 · No record at this address</p>
          <h1 className="pm-display" style={{ maxWidth: "12ch", marginBottom: 24 }}>
            This page isn&rsquo;t on the rail.
          </h1>
          <p className="pm-lead" style={{ maxWidth: "48ch", marginBottom: 40 }}>
            Nothing was found at this URL. It may have moved, or the link may be wrong. The rest of the site is unaffected.
          </p>
          <Link href="/" className="pm-btn pm-btn-filled">
            Back to ProofMart
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
