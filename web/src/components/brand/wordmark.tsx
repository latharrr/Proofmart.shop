import Link from "next/link";

/**
 * The ProofMart mark and wordmark — one definition for the topbar, footer,
 * auth shell, app shell and 404.
 *
 * The mark is a page with a pin box: an ink tile whose lower band is struck
 * through by a paper row, the way a finding boxes the line that broke. Drawn
 * as SVG so it stays crisp at every size and inherits `currentColor`.
 */
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <rect x="0" y="0" width="24" height="24" rx="7" fill="currentColor" />
      <rect x="5.5" y="6" width="9" height="1.8" rx="0.9" fill="var(--paper, #fff)" opacity="0.55" />
      <rect x="5.5" y="9.6" width="13" height="1.8" rx="0.9" fill="var(--paper, #fff)" opacity="0.55" />
      <rect x="4" y="13.4" width="16" height="5" rx="2.5" fill="none" stroke="var(--paper, #fff)" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Mark plus name. `href` makes it a link home — `#main` on the home page
 * itself, `/` everywhere else.
 */
export default function Wordmark({ href, size = 26, fontSize = 22 }: { href?: string; size?: number; fontSize?: number }) {
  const inner = (
    <>
      <BrandMark size={size} />
      <span style={{ fontSize, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1 }}>ProofMart</span>
    </>
  );

  const style = { display: "inline-flex", alignItems: "center", gap: 10, color: "var(--ink, #0b0c10)", flex: "none" } as const;

  if (!href) return <span style={style}>{inner}</span>;
  // In-page fragments stay a plain <a>: next/link would try to prefetch a route for "#main".
  if (href.startsWith("#") || href.startsWith("/#")) {
    return (
      <a href={href} style={style} aria-label="ProofMart home">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} style={style} aria-label="ProofMart home">
      {inner}
    </Link>
  );
}
