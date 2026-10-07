import type { ReactNode } from "react";

/**
 * The inside of a rolling-label pill (foundation `.pm-pill`), for the few
 * account buttons that can't be a <RollPill> because another component owns
 * the <button>: <ConfirmSubmitButton> (revoke, delete) and <CopyButton>.
 * Pair with `className="pm-pill" data-variant data-size` on the button.
 */
export default function PillLabel({ children, dot }: { children: ReactNode; dot?: boolean }) {
  return (
    <>
      <span className="pm-pill-roll">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      {dot ? <span className="pm-pill-dot" aria-hidden="true" /> : null}
    </>
  );
}
