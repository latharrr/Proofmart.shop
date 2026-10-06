import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import GoogleMark from "@/components/auth/google-mark";
import * as s from "@/components/auth/auth-styles";
import { login, signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your ProofMart account."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="pm-hoverable" style={{ color: "var(--pm-ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Sign up
          </Link>
        </>
      }
    >
      {error && <div style={s.errorBanner}>{error}</div>}

      <form action={signInWithGoogle}>
        <button type="submit" className="pm-btn pm-btn-ghost" style={s.secondaryButton}>
          <GoogleMark />
          Continue with Google
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ flex: 1, height: 1, background: "var(--pm-hairline)" }} />
        <span className="pm-eyebrow" style={{ margin: 0 }}>or</span>
        <span style={{ flex: 1, height: 1, background: "var(--pm-hairline)" }} />
      </div>

      <form action={login} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="email" style={s.label}>
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required style={s.input} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label htmlFor="password" style={s.label}>
              Password
            </label>
            <Link href="/account/reset-password" className="pm-nav-link" style={{ fontSize: 15 }}>
              Forgot?
            </Link>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" required style={s.input} />
        </div>
        <button type="submit" className="pm-btn pm-btn-filled" style={{ ...s.primaryButton, marginTop: 4 }}>
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}
