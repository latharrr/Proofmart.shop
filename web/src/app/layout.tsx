import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Both are self-hosted by next/font at build time. The CSP allows
// `font-src 'self'` only, so a <link> to fonts.googleapis.com would be
// blocked by the browser and the page would silently fall back to a system
// stack — next/font is the only way these can load here.
//
// design-system.md §1: one grotesk for everything (Geist, 400 + 500 only in
// practice), plus Geist Mono reserved for machine strings. Loaded without
// `weight` so the variable wght axis ships as one file per family.
//
// The next/font variables are `--font-geist-sans` / `--font-geist-mono`.
// globals.css maps the names the rest of the app reads onto them:
// `--font-sans`, `--font-mono`, `--pm-sans`, `--pm-mono`, and the retired
// `--font-serif` / `--pm-serif` (now Geist too — the system has no serif).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Scroll reveals rest at opacity 0 until JS shows them — without this, a no-JS visitor would get a blank page. */}
        <noscript>
          <style>{".pm-reveal,.pm-rise,.pm-lines .pm-lines-word>span{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <a href="#main" className="pm-skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
