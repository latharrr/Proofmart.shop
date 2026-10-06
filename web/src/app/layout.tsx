import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// All three are self-hosted by next/font at build time. The CSP allows
// `font-src 'self'` only, so a <link> to fonts.googleapis.com would be
// blocked by the browser and the page would silently fall back to a system
// stack — next/font is the only way these can load here.

// Loaded without `weight` so the variable wght axis ships: the design system
// asks for 450 on body-lg/heading-sm/buttons, which is not a static instance.
const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// The display face. Instrument Serif ships 400 regular + 400 italic and
// nothing else, which is deliberate: the system forbids serif at any weight
// but 400, and this family cannot violate that rule even by accident.
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable}`}>
      <body>
        {/* Scroll reveals rest at opacity 0 until JS shows them — without this, a no-JS visitor would get a blank page. */}
        <noscript>
          <style>{".pm-reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <a href="#main" className="pm-skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
