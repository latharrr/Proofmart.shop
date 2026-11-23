import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import MotionLayer, { MOTION_BOOT } from "@/components/motion/motion-layer";
import "./globals.css";

// All three are self-hosted by next/font at build time. The CSP allows
// `font-src 'self'` only, so a <link> to fonts.googleapis.com would be
// blocked and the page would silently fall back to a system stack.
//
// The console system (DESIGN.md): Geist sets UI and headings, Geist Mono
// every figure, code and label, and Instrument Serif italic is the one
// editorial voice, a few words per section at most.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: "italic", display: "swap" });

const TITLE = "ProofMart · Document forensics API";
const DESCRIPTION =
  "ProofMart takes a PDF and returns a structured report of findings, each pinned to its pixel, each with the arithmetic.";

export const metadata: Metadata = {
  metadataBase: new URL("https://proofmart.shop"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://proofmart.shop",
    siteName: "ProofMart",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
  verification: {
    google: "sozhQivIDqNiX66dL6Rx0gFIHqeyKvYW3PWgMx6-X-o",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>
        {/* Before first paint: opt in to entrance states unless reduced motion is preferred. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "ProofMart",
              url: "https://proofmart.shop",
              description:
                "ProofMart takes a PDF and returns a structured report of findings, each pinned to its pixel, each with the arithmetic.",
            }),
          }}
        />
        <a href="#main" className="pm-skip-link">
          Skip to content
        </a>
        {children}
        <MotionLayer />
      </body>
    </html>
  );
}
