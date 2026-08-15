import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";
import { MONO, SANS, VERDICT } from "@/lib/evidence-data";

export default function NotFound() {
  const v = VERDICT.INCONCLUSIVE;

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", color: "#0E1216" }}>
      <Topbar />
      <main id="main" style={{ maxWidth: 1320, margin: "0 auto", padding: "120px 32px 160px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: MONO,
            fontSize: 11,
            color: "#767C83",
            letterSpacing: "0.08em",
            marginBottom: 24,
          }}
        >
          <span aria-hidden="true" style={{ width: 12, textAlign: "center", fontFamily: MONO, fontSize: 12, color: v.color, fontWeight: 500 }}>
            {v.glyph}
          </span>
          404 · NO RECORD AT THIS ADDRESS
        </div>
        <h1
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
            maxWidth: "14ch",
          }}
        >
          This page isn&rsquo;t on the rail.
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.55, color: "#43494F", maxWidth: "48ch", margin: "0 0 40px" }}>
          Nothing was found at this URL. It may have moved, or the link may be wrong. The rest of the site is unaffected.
        </p>
        <Link
          href="/"
          className="pm-hoverable"
          style={{
            display: "inline-block",
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.06em",
            padding: "12px 18px",
            background: "#0E1216",
            color: "#F5F5F0",
            borderRadius: 3,
          }}
        >
          ← BACK TO PROOFMART
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
