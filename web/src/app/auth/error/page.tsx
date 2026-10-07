import type { ReactNode } from "react";
import Link from "next/link";
import AuthShell, { CrossLink } from "@/components/auth/auth-shell";
import GoogleMark from "@/components/auth/google-mark";
import { SubmitButton } from "@/components/auth/fields";
import { linkError, type LinkErrorKind } from "@/components/auth/auth-errors";
import { signInWithGoogle } from "@/app/login/actions";

// The PKCE callback lands here when a mailed or OAuth link can't be exchanged
// for a session, forwarding whatever the provider said (`error`, `error_code`,
// `error_description`). Each cause gets its own explanation and the one next
// step that fits it; only when the cause doesn't tell us which flow the person
// was in do we fall back to one row per thing they may have been doing.

type Path = { doing: string; next: string; href: string };

const SIGN_IN_ROW: Path = { doing: "Confirming your email, or signing in with Google", next: "Sign in", href: "/login" };
const RESET_ROW: Path = { doing: "Resetting your password", next: "Send a new reset link", href: "/account/reset-password" };

const ROWS: Partial<Record<LinkErrorKind, Path[]>> = {
  expired: [{ ...SIGN_IN_ROW, doing: "Confirming your email" }, RESET_ROW],
  browser: [SIGN_IN_ROW, RESET_ROW],
  missing: [SIGN_IN_ROW, RESET_ROW],
  unknown: [SIGN_IN_ROW, RESET_ROW],
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
  const rows = ROWS[copy.kind];

  let footer: ReactNode;
  if (copy.kind === "cancelled") {
    footer = <CrossLink prompt="Rather use your email?" label="Sign in with a password" href="/login" />;
  } else if (copy.kind === "server") {
    footer = <CrossLink prompt="Were you resetting your password?" label="Send a new reset link" href="/account/reset-password" />;
  }

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.body}
      aside="return"
      footer={footer}
      below={
        copy.reference ? (
          <p className="pm-caption pm-auth-detail" style={{ marginTop: 24 }}>
            If you contact support, quote: <span>{copy.reference}</span>
          </p>
        ) : undefined
      }
    >
      {copy.kind === "cancelled" && (
        <form action={signInWithGoogle} className="pm-auth-form">
          <SubmitButton icon={<GoogleMark />} pendingLabel="Opening Google…">
            Start Google sign-in again
          </SubmitButton>
        </form>
      )}

      {copy.kind === "server" && (
        <Link href="/login" className="pm-btn pm-btn-filled pm-auth-btn">
          Try again
        </Link>
      )}

      {rows && (
        <section aria-labelledby="auth-error-next">
          <h2 id="auth-error-next" className="pm-eyebrow" style={{ marginBottom: 8 }}>
            What were you doing?
          </h2>
          <ul className="pm-auth-paths">
            {rows.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="pm-auth-path">
                  <span className="pm-auth-path-doing">{p.doing}</span>
                  <span className="pm-auth-path-next">
                    {p.next}
                    <span className="pm-arrow" aria-hidden="true">
                      <span>→</span>
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
