import Link from "next/link";

/**
 * The ProofMart mark and wordmark. Previously copy-pasted into the topbar,
 * the footer, the auth shell, /security and /not-found — five places that
 * had already drifted apart on size and colour. One definition means the
 * mark can only look one way.
 *
 * The mark is a seal: an ink disc with a paper ring struck out of it. Round
 * rather than square because nothing in this system renders below a 12px
 * radius, and because a stamp is what a verification leaves behind.
 */
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--pm-ink)",
        display: "grid",
        placeItems: "center",
        flex: "none",
      }}
    >
      <span
        style={{
          width: Math.round(size * 0.375),
          height: Math.round(size * 0.375),
          borderRadius: "50%",
          border: "1.5px solid var(--pm-paper)",
          display: "block",
        }}
      />
    </span>
  );
}

/**
 * Mark plus name. `href` makes it a link home — which is what it should be
 * everywhere except on the home page itself, where it is a link to `#main`.
 */
export default function Wordmark({ href, size = 24, fontSize = 20 }: { href?: string; size?: number; fontSize?: number }) {
  const inner = (
    <>
      <BrandMark size={size} />
      <span style={{ fontSize, fontWeight: 500, letterSpacing: "-0.02em" }}>ProofMart</span>
    </>
  );

  const style = { display: "inline-flex", alignItems: "center", gap: 10, color: "var(--pm-ink)" } as const;

  if (!href) return <span style={style}>{inner}</span>;
  // In-page fragments stay a plain <a>: next/link would try to prefetch a
  // route for "#main".
  if (href.startsWith("#")) {
    return (
      <a href={href} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} style={style}>
      {inner}
    </Link>
  );
}
