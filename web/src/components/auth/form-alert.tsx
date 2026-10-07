import type { ReactNode } from "react";
import Link from "next/link";

/**
 * A message that sits directly under (or above) the control it is about.
 * Drawn like a finding row: paper, a 3px edge in the verdict colour for the
 * state it reports (fail = something went wrong, clear = done), and nothing
 * else coloured.
 */
export default function FormAlert({
  tone,
  id,
  title,
  body,
  action,
  children,
}: {
  tone: "error" | "success";
  id?: string;
  title: string;
  body?: string;
  action?: { label: string; href: string };
  /** Extra controls, e.g. a resend button. */
  children?: ReactNode;
}) {
  return (
    <div id={id} className="pm-auth-alert" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      <p className="pm-auth-alert-title">
        <span className="pm-auth-sr">{tone === "error" ? "Error: " : "Done: "}</span>
        {title}
      </p>
      {body && <p className="pm-auth-alert-body">{body}</p>}
      {(action || children) && (
        <div className="pm-auth-alert-actions">
          {action && (
            <Link href={action.href} className="pm-inline-link pm-auth-alert-link">
              {action.label}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
