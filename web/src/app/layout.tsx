import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Libre_Franklin } from "next/font/google";
import "./globals.css";

// Both are self-hosted by next/font at build time. The CSP allows
// `font-src 'self'` only, so a <link> to fonts.googleapis.com would be
// blocked by the browser and the page would silently fall back to a system
// stack: next/font is the only way these can load here.
//
// The working-paper system (DESIGN.md): Libre Franklin, the gothic printed
// on ledger pads and bank forms, sets headings, UI and prose; JetBrains Mono
// sets figures, code and identifiers, where every digit must line up.
const franklin = Libre_Franklin({
  variable: "--font-franklin",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${franklin.variable} ${jetbrains.variable}`}>
      <body>
        <a href="#main" className="pm-skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
