import Link from "next/link";

/**
 * The ProofMart mark and wordmark: one definition for the topbar, footer,
 * auth shell, app shell and 404.
 *
 * The mark is a ruled sheet with a red-pencil tick through its last line:
 * a figure checked. Drawn as SVG so it stays crisp at every size; the sheet
 * takes `currentColor`, the tick the red pencil.
 */
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <path d="M3.5 1.75h12.6l4.4 4.4V22.25H3.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" />
      <path d="M7 8.5h9.5M7 12.25h9.5M7 16h4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.6 16.4 14.6 19.4 22.4 9.8" fill="none" stroke="var(--red, #bf3020)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Mark plus name. `href` makes it a link home: `#main` on the home page
 * itself, `/` everywhere else.
 */
export default function Wordmark({ href, size = 24, fontSize = 21 }: { href?: string; size?: number; fontSize?: number }) {
  const inner = (
    <>
      <BrandMark size={size} />
      <span style={{ fontSize, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>ProofMart</span>
    </>
  );

  const style = { display: "inline-flex", alignItems: "center", gap: 9, color: "var(--ink, #222527)", flex: "none", textDecoration: "none" } as const;

  if (!href) return <span style={style}>{inner}</span>;
  // In-page fragments stay a plain <a>: next/link would try to prefetch a route for "#main".
  if (href.startsWith("#") || href.startsWith("/#")) {
    return (
      <a href={href} style={style} aria-label="ProofMart home" className="pm-wordmark">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} style={style} aria-label="ProofMart home" className="pm-wordmark">
      {inner}
    </Link>
  );
}
