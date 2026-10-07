import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import { linkError } from "@/components/auth/auth-errors";

// The PKCE callback lands here when a mailed or OAuth link can't be exchanged
// for a session. We can't tell which flow the link came from, so the page
// names the likely cause and then gives one row per thing the person was
// trying to do, each with its own way forward.

const PATHS = [
  {
    doing: "Confirming your email, or signing in with Google",
    next: "Sign in",
    href: "/login",
  },
  {
    doing: "Resetting your password",
    next: "Send a new reset link",
    href: "/account/reset-password",
  },
];

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const copy = linkError(error);

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.body}
      aside="return"
      below={
        error ? (
          <p className="pm-caption pm-auth-detail" style={{ marginTop: 24 }}>
            Message from the sign-in service: <span>{error}</span>
          </p>
        ) : undefined
      }
    >
      <section aria-labelledby="auth-error-next">
        <h2 id="auth-error-next" className="pm-eyebrow" style={{ marginBottom: 8 }}>
          What were you doing?
        </h2>
        <ul className="pm-auth-paths">
          {PATHS.map((p) => (
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
    </AuthShell>
  );
}
