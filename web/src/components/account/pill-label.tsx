import type { ReactNode } from "react";

/**
 * The inside of a button whose <button> another component owns
 * (<ConfirmSubmitButton> for revoke and delete, <CopyButton>). Pair with
 * `className="pm-pill" data-variant data-size` on the button.
 */
export default function PillLabel({ children, dot }: { children: ReactNode; dot?: boolean }) {
  return (
    <>
      <span className="pm-pill-roll">{children}</span>
      {dot ? (
        <svg className="pm-pill-dot" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 7.2h9.2M7.6 3.4 11.4 7.2 7.6 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        </svg>
      ) : null}
    </>
  );
}
