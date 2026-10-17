import type { ReactNode } from "react";
import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import RollPill from "@/components/motion/roll-pill";
import AuthStage, { type AuthStageProps } from "@/components/auth/auth-stage";

/**
 * Frame for every auth page: the pad's printed head (mark home, a plain way
 * back to the site, a button to the other flow), one column that states the
 * page's single purpose, and the
 * sample statement on its working paper beside the form (after it on a
 * phone).
 */
export default function AuthShell({
  title,
  size = "lg",
  subtitle,
  children,
  footer,
  switchTo,
  stage,
  below,
}: {
  /** Accepted for older call sites; the title carries the page's state. */
  eyebrow?: string;
  title: ReactNode;
  /** lg = heading-lg (short titles), md = heading (sentences). */
  size?: "lg" | "md";
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** The pill in the top bar: the other auth flow. */
  switchTo?: { label: string; href: string };
  stage: AuthStageProps;
  /** Extra content after the footer. */
  below?: ReactNode;
}) {
  return (
    <div className="pm-auth">
      <header className="pm-auth-top">
        <Wordmark href="/" />
        <nav className="pm-auth-nav" aria-label="Account">
          <Link href="/" className="pm-link pm-auth-home">
            <span className="pm-auth-home-long">Back to home</span>
            <span className="pm-auth-home-short">Home</span>
          </Link>
          {switchTo && (
            <RollPill href={switchTo.href} variant="secondary" size="sm" dot>
              {switchTo.label}
            </RollPill>
          )}
        </nav>
      </header>

      <div className="pm-auth-grid">
        <main id="main" className="pm-auth-col">
          <div className="pm-auth-title-row">
            <h1 className="pm-auth-title" data-size={size}>
              {title}
            </h1>
          </div>
          {subtitle && <p className="pm-auth-sub">{subtitle}</p>}

          <div className="pm-auth-stack">{children}</div>

          {footer && <div className="pm-auth-footer">{footer}</div>}
          {below}
        </main>

        <AuthStage {...stage} />
      </div>
    </div>
  );
}

/** "Already have an account? Sign in →": the cross-link under each form. */
export function CrossLink({ prompt, label, href }: { prompt: string; label: string; href: string }) {
  return (
    <p className="pm-auth-cross">
      <span>{prompt}</span>{" "}
      <Link href={href} className="pm-link pm-auth-xlink">
        {label}
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
