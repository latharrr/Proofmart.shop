import Link from "next/link";
import { Arrow } from "@/components/paper/tickmark";

export type Way = { href: string; title: string; body: string };

/**
 * The 404's way out, as an index: the one path asked for, marked missing,
 * then the pages that do exist. Nothing here takes a verdict colour: a
 * missing page isn't a verdict on anyone's document.
 */
export default function MissingPageStage({ ways }: { ways: Way[] }) {
  return (
    <div className="pm-nf-index">
      <div className="pm-nf-index-head">
        <span>Index</span>
        <span className="pm-mono">proofmart.shop</span>
      </div>
      <ol aria-label="Requested page">
        <li data-missing="">
          <span className="pm-mono pm-nf-index-ref">404</span>
          <span>The page you asked for</span>
          <span className="pm-nf-index-note">does not exist</span>
        </li>
      </ol>
      <nav aria-label="Pages that exist">
        <ul className="pm-nf-index-ways">
          {ways.map((w) => {
            const body = (
              <>
                <span className="pm-mono pm-nf-index-ref">{w.href}</span>
                <span className="pm-nf-index-way">
                  <span className="pm-nf-index-title">{w.title}</span>
                  <span className="pm-nf-index-note">{w.body}</span>
                </span>
                <Arrow />
              </>
            );
            return (
              <li key={w.href}>
                {w.href.startsWith("/#") ? (
                  <a href={w.href}>{body}</a>
                ) : (
                  <Link href={w.href}>{body}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
