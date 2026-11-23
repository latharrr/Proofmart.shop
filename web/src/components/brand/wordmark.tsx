import Link from "next/link";

/**
 * The ProofMart mark and wordmark: one definition for the topbar, footer,
 * auth shell, app shell and 404.
 *
 * The mark is a page with one row boxed: a finding pinned to its place. The
 * page takes `currentColor`; the box is the one --signal accent in the mark.
 */
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <path d="M4.75 2.75h14.5v18.5H4.75Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7h8M8 10h8M8 17h5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.75 12.25h10.5v2.5H6.75Z" fill="var(--signal, #FF4D00)" />
    </svg>
  );
}

/**
 * Mark plus name. `href` makes it a link home: `#main` on the home page
 * itself, `/` everywhere else.
 */
export default function Wordmark({ href, size = 22, fontSize = 19 }: { href?: string; size?: number; fontSize?: number }) {
  const inner = (
    <>
      <BrandMark size={size} />
      <span style={{ fontSize, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1 }}>ProofMart</span>
    </>
  );

  const style = { display: "inline-flex", alignItems: "center", gap: 8, color: "var(--ink, #0E0E0C)", flex: "none", textDecoration: "none" } as const;

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
