import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const TITLE = "ProofMart · Document forensics API";
const DESCRIPTION =
  "ProofMart takes a PDF and returns a signed dossier of findings, each pinned to its pixel, each with the arithmetic.";

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
    <html lang="en" className={`${instrumentSans.variable} ${ibmPlexMono.variable}`}>
      <body>
        <a href="#main" className="pm-skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
