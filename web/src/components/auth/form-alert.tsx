import Link from "next/link";

/**
 * A message that sits directly above the control it is about. Achromatic
 * surface; the only colour is the small status disc, and it is the verdict
 * colour for the state it reports (fail = something went wrong, clear = done).
 */
export default function FormAlert({
  tone,
  id,
  title,
  body,
  action,
}: {
  tone: "error" | "success";
  id?: string;
  title: string;
  body?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div id={id} className="pm-auth-alert" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      <span className="pm-auth-alert-mark" aria-hidden="true">
        {tone === "error" ? (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M6 2.5v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="6" cy="9.2" r="0.95" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2.8 6.3 5 8.4l4.2-4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div>
        <p className="pm-auth-alert-title">
          <span className="pm-auth-sr">{tone === "error" ? "Error: " : ""}</span>
          {title}
        </p>
        {body && <p className="pm-auth-alert-body">{body}</p>}
        {action && (
          <Link href={action.href} className="pm-link pm-auth-alert-link">
            {action.label}
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
