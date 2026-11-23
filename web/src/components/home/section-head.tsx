import type { ReactNode } from "react";

/**
 * A section's opening: the mono index row (`[02] — EVIDENCE RAIL ····· meta`)
 * on a 1px rule, then the title and its aside on the 12-column grid. The
 * dotted leader fills left to right when the row enters (motion layer,
 * `[data-leader]`); at rest and under reduced motion it is already drawn.
 */
export default function SectionHead({
  n,
  label,
  meta,
  id,
  title,
  aside,
}: {
  n: string;
  label: string;
  meta?: ReactNode;
  id: string;
  title: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="pm-sh">
      <p className="pm-index" data-leader="">
        <span className="pm-index-n">[{n}]</span>
        <span className="pm-index-dash" aria-hidden="true">
          —
        </span>
        <span className="pm-index-label">{label}</span>
        <span className="pm-index-leader" aria-hidden="true" />
        {meta ? <span className="pm-index-meta">{meta}</span> : null}
      </p>
      <div className="pm-sh-row">
        <h2 id={id} className="pm-sh-title" data-decode="">
          {title}
        </h2>
        {aside ? (
          <div className="pm-sh-aside" data-reveal="">
            {aside}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/** The one editorial voice: 1–3 words of Instrument Serif italic. */
export function Serif({ children }: { children: ReactNode }) {
  return <em className="pm-serif">{children}</em>;
}
