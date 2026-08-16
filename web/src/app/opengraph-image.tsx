import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "ProofMart — document forensics API";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Serves /opengraph-image automatically (Next.js file convention) and is
// picked up for both openGraph.images and the Twitter card in layout.tsx's
// metadata without either needing to reference it explicitly. Built with
// next/og's Satori renderer, not a static asset — no image file to keep in
// sync with the real palette (#0E1216/#F5F5F0/#767C83, same tokens as
// lib/evidence-data.ts's MONO/SANS) by hand. System fonts only: Satori
// doesn't resolve this app's next/font CSS variables, and fetching the
// real webfont files here would be one more thing to keep working.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "#0E1216",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, background: "#F5F5F0", position: "relative", display: "flex" }}>
            <div style={{ position: "absolute", inset: 9, border: "3px solid #0E1216" }} />
          </div>
          <span style={{ fontSize: 32, fontWeight: 600, color: "#F5F5F0", letterSpacing: "-0.01em" }}>ProofMart</span>
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 500, color: "#F5F5F0", letterSpacing: "-0.02em", lineHeight: 1.15, maxWidth: 920 }}>
          Document forensics as a structured evidence graph
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 22, color: "#9AA0A6", fontFamily: "monospace", letterSpacing: "0.02em" }}>
          UPLOAD A PDF · GET REAL FINDINGS, PINNED TO THE PIXEL
        </div>
      </div>
    ),
    { ...size },
  );
}
