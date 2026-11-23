import type { ReactNode } from "react";
import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import RollPill from "@/components/motion/roll-pill";
import AuthStage, { type AuthStageProps } from "@/components/auth/auth-stage";

/**
 * Frame for every auth page: a thin bar (mark home, a way back, the other
 * flow), then one centred, bordered panel on the grid: a mono index row,
 * the page's single purpose, the form, and a ruled band under it.
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
  index = "01",
  indexLabel = "Account",
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
  /** The panel's index row: number and label. */
  index?: string;
  indexLabel?: string;
}) {
  return (
    <div className="pm-auth">
      <header className="pm-auth-top">
        <div className="pm-wrap pm-auth-top-inner">
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
        </div>
      </header>

      <main id="main" className="pm-auth-main">
        <div className="pm-auth-card">
          <p className="pm-index">
            <span className="pm-index-n">[{index}]</span>
            <span className="pm-index-dash" aria-hidden="true">
              —
            </span>
            <span className="pm-index-label">{indexLabel}</span>
            <span className="pm-index-leader" aria-hidden="true" />
            <span className="pm-index-meta">proofmart.shop</span>
          </p>
          <div className="pm-auth-col">
            <h1 className="pm-auth-title" data-size={size}>
              {title}
            </h1>
            {subtitle && <p className="pm-auth-sub">{subtitle}</p>}

            <div className="pm-auth-stack">{children}</div>

            {footer && <div className="pm-auth-footer">{footer}</div>}
            {below}
          </div>
          <AuthStage {...stage} />
        </div>
      </main>
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
