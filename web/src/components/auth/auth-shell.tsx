import type { ReactNode } from "react";
import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import LineReveal from "@/components/motion/line-reveal";
import RollPill from "@/components/motion/roll-pill";
import AuthStage, { type AuthStageProps } from "@/components/auth/auth-stage";

/**
 * Frame for every auth page: a slim top bar (mark home, a plain way back to
 * the site, and a pill to the other flow), one column that states the page's
 * single purpose in a masked headline, and the product in real-time 3D in a
 * framed stage: beside the form on desktop, after it on mobile.
 */
export default function AuthShell({
  eyebrow,
  title,
  size = "lg",
  subtitle,
  children,
  footer,
  switchTo,
  stage,
  below,
}: {
  /** Small uppercase line above the headline. */
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
          <Link href="/" className="pm-inline-link pm-auth-home">
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
          {eyebrow && <p className="pm-t-label pm-auth-eyebrow">{eyebrow}</p>}
          <LineReveal as="h1" className={`${size === "lg" ? "pm-t-heading-lg" : "pm-t-heading"} pm-auth-title`}>
            {title}
          </LineReveal>
          {subtitle && <p className="pm-t-body-lg pm-auth-sub">{subtitle}</p>}

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
    <p className="pm-t-body pm-auth-cross">
      <span>{prompt}</span>{" "}
      <Link href={href} className="pm-inline-link pm-auth-xlink">
        {label}
      </Link>
    </p>
  );
}

/** The "or" rule between Google and email. */
export function OrDivider() {
  return (
    <div className="pm-auth-or" role="separator" aria-label="or">
      <span className="pm-t-label" aria-hidden="true">
        or
      </span>
    </div>
  );
}
