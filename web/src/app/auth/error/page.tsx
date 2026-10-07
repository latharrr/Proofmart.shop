import type { ReactNode } from "react";
import Link from "next/link";
import AuthShell, { CrossLink } from "@/components/auth/auth-shell";
import { FindingBand } from "@/components/auth/auth-stage";
import GoogleMark from "@/components/auth/google-mark";
import HashForward from "@/components/auth/hash-forward";
import RollPill from "@/components/motion/roll-pill";
import { EmailField, SubmitButton } from "@/components/auth/fields";
import { linkError, type LinkErrorKind } from "@/components/auth/auth-errors";
import { signInWithGoogle } from "@/app/login/actions";
import { resendConfirmation } from "@/app/signup/actions";

// The PKCE callback lands here when a mailed or OAuth link can't be exchanged
// for a session, forwarding whatever the provider said (`error`, `error_code`,
// `error_description`). Each cause gets its own explanation and the next step
// that fits it; only when the cause doesn't tell us which flow the person was
// in do we offer one row per thing they may have been doing.

type Path = { doing: string; next: string; href: string };

const SIGN_IN: Path = { doing: "Signing in", next: "Sign in", href: "/login" };
const CONFIRM: Path = { doing: "Confirming your email", next: "Resend the confirmation", href: "/signup?check-email=1" };
const RESET: Path = { doing: "Resetting your password", next: "Send a new reset link", href: "/account/reset-password" };

const PATHS: Partial<Record<LinkErrorKind, Path[]>> = {
  expired: [RESET],
  browser: [SIGN_IN, CONFIRM, RESET],
  missing: [SIGN_IN, CONFIRM, RESET],
  unknown: [SIGN_IN, CONFIRM, RESET],
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; error_code?: string | string[]; error_description?: string | string[] }>;
}) {
  const sp = await searchParams;
  const copy = linkError({
    error: one(sp.error),
    error_code: one(sp.error_code),
    error_description: one(sp.error_description),
  });
  const paths = PATHS[copy.kind];

  let footer: ReactNode = <CrossLink prompt="Not sure what happened?" label="Start from sign in" href="/login" />;
  if (copy.kind === "cancelled") {
    footer = <CrossLink prompt="Rather use your email?" label="Sign in with a password" href="/login" />;
  } else if (copy.kind === "server") {
    footer = <CrossLink prompt="Were you resetting your password?" label="Send a new reset link" href="/account/reset-password" />;
  } else if (copy.kind === "expired") {
    footer = <CrossLink prompt="Already confirmed?" label="Sign in" href="/login" />;
  }

  return (
    <AuthShell
      eyebrow={copy.tag}
      title={copy.title}
      size="md"
      subtitle={copy.body}
      switchTo={{ label: "Sign in", href: "/login" }}
      stage={{
        variant: "single",
        verdict: "REVIEW",
        label: "Nothing was changed",
        band: (
          <FindingBand
            line="Your account and your reports are untouched. Only the link didn’t go through."
            points={["Links work once", "Same browser only", "A fresh one takes seconds"]}
          />
        ),
      }}
      footer={footer}
      below={
        copy.reference ? (
          <p className="pm-t-body pm-auth-ref">
            If you contact support, quote <span className="pm-t-mono">{copy.reference}</span>
          </p>
        ) : undefined
      }
    >
      {sp.error === undefined && sp.error_code === undefined && sp.error_description === undefined && <HashForward />}

      {copy.kind === "cancelled" && (
        <>
          <form action={signInWithGoogle} className="pm-auth-form">
            <SubmitButton icon={<GoogleMark />} variant="paper" dot={false} pendingLabel="Opening Google">
              Continue with Google again
            </SubmitButton>
          </form>
          <RollPill href="/login" variant="secondary" block dot>
            Sign in with email instead
          </RollPill>
        </>
      )}

      {copy.kind === "server" && (
        <RollPill href="/login" block dot>
          Try again
        </RollPill>
      )}

      {copy.kind === "expired" && (
        <form action={resendConfirmation} className="pm-auth-form pm-auth-panel">
          <p className="pm-t-label pm-auth-panel-title">Confirming your email?</p>
          <EmailField restore label="Email you signed up with" />
          <SubmitButton pendingLabel="Sending">Resend confirmation email</SubmitButton>
        </form>
      )}

      {paths && (
        <section aria-labelledby="auth-error-next" className="pm-auth-paths-wrap">
          <h2 id="auth-error-next" className="pm-t-label pm-auth-paths-title">
            {copy.kind === "expired" ? "Resetting your password instead?" : "What were you doing?"}
          </h2>
          <ul className="pm-auth-paths">
            {paths.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="pm-auth-path">
                  <span className="pm-auth-path-doing">{p.doing}</span>
                  <span className="pm-auth-path-next pm-t-label">
                    {p.next}
                    <span className="pm-auth-path-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AuthShell>
  );
}
