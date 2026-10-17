import type { ReactNode } from "react";

/**
 * A section's heading row, ruled like the top of a working paper: the title
 * on the left and the sheet's reference letter boxed in red pencil on the
 * right, where an auditor writes it. The reference is how other sheets cite
 * this one ("see W/P C"), so it is real navigation, not ornament.
 */
export default function SheetHead({
  id,
  title,
  wp,
  aside,
  size = "lg",
}: {
  id: string;
  title: ReactNode;
  /** The working-paper reference letter, e.g. "C". */
  wp: string;
  aside?: ReactNode;
  size?: "lg" | "md";
}) {
  return (
    <header className="pm-h-head" data-size={size}>
      <div className="pm-h-head-row">
        <h2 id={id} className="pm-h-head-title">
          {title}
        </h2>
        <span className="pm-wp" aria-label={`Working paper ${wp}`}>
          W/P {wp}
        </span>
      </div>
      {aside ? <div className="pm-h-head-aside">{aside}</div> : null}
    </header>
  );
}
