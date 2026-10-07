import type { ReactNode } from "react";
import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import AuthAside from "@/components/auth/auth-aside";

/**
 * Frame for every auth page: a slim top bar (mark home, a plain way back to
 * the site), one column that states the page's single purpose in the display
 * serif, and — from 1024px — the product itself floating on the right.
 *
 * `title`/`subtitle`/`children`/`footer` are the original props and keep
 * their meaning; `aside` and `below` are additive, so any older caller
 * renders exactly one centred column as before.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside,
  below,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Product panel shown beside the form at desktop width. */
  aside?: "return" | "signup";
  /** Extra content after the footer, e.g. the signup benefits on narrow screens. */
  below?: ReactNode;
}) {
  return (
    <div className="pm-auth" data-aside={aside ? "true" : undefined}>
      <div className="pm-auth-main">
        <header className="pm-auth-top">
          <Wordmark href="/" />
          <Link href="/" className="pm-link pm-auth-home">
            Back to home
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </Link>
        </header>

        <main id="main" className="pm-auth-body">
          <div className="pm-auth-col">
            <h1 className="pm-auth-title">{title}</h1>
            {subtitle && <p className="pm-auth-sub">{subtitle}</p>}

            <div className="pm-auth-stack">{children}</div>

            {footer && <div className="pm-auth-footer">{footer}</div>}
            {below}
          </div>
        </main>
      </div>

      {aside && <AuthAside variant={aside} />}
    </div>
  );
}

/** "Already have an account? Sign in →" — the cross-link under each form. */
export function CrossLink({ prompt, label, href }: { prompt: string; label: string; href: string }) {
  return (
    <p className="pm-body">
      {prompt}{" "}
      <Link href={href} className="pm-link pm-auth-xlink">
        {label}
        <span className="pm-arrow" aria-hidden="true">
          <span>→</span>
        </span>
      </Link>
    </p>
  );
}

/** The "or" rule between Google and email. */
export function OrDivider() {
  return (
    <div className="pm-auth-or" role="separator" aria-label="or">
      <span aria-hidden="true">or</span>
    </div>
  );
}
