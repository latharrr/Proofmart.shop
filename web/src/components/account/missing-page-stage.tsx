import Link from "next/link";
import { Arrow } from "@/components/paper/tickmark";

export type Way = { href: string; title: string; body: string };

const SHEETS = [
  { ref: "401", title: "Unauthorised" },
  { ref: "402", title: "Payment required" },
  { ref: "403", title: "Forbidden" },
];

/**
 * The 404's picture and its way out, as one schedule: the index of working
 * papers in this file, where every sheet is on file except the one asked
 * for, followed by the sheets that are. Nothing here takes a pencil colour:
 * a missing page isn't a verdict on anyone's document.
 */
export default function MissingPageStage({ ways }: { ways: Way[] }) {
  return (
    <div className="pm-nf-index">
      <div className="pm-nf-index-head">
        <span>Index of working papers</span>
        <span className="pm-mono">proofmart.shop</span>
      </div>
      <ol aria-label="Error sheets in this file">
        {SHEETS.map((s) => (
          <li key={s.ref}>
            <span className="pm-mono pm-nf-index-ref">{s.ref}</span>
            <span>{s.title}</span>
            <span className="pm-nf-index-note">on file</span>
          </li>
        ))}
        <li data-missing="">
          <span className="pm-mono pm-nf-index-ref">404</span>
          <span>The page you asked for</span>
          <span className="pm-nf-index-note">not in this file</span>
        </li>
      </ol>
      <nav aria-label="Pages that are on file">
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
