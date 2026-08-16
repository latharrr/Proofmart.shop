import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import GoogleMark from "@/components/auth/google-mark";
import * as s from "@/components/auth/auth-styles";
import { signup } from "./actions";
import { signInWithGoogle } from "@/app/login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; "check-email"?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Create an account"
      subtitle="Upload documents, keep a history, and get an API key."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="pm-hoverable" style={{ color: "#0E1216", textDecoration: "underline" }}>
            Sign in
          </Link>
        </>
      }
    >
      {params["check-email"] && (
        <div style={s.successBanner}>Check your email for a confirmation link to finish creating your account.</div>
      )}
      {params.error && <div style={s.errorBanner}>{params.error}</div>}

      <form action={signInWithGoogle}>
        <button type="submit" className="pm-hoverable" style={s.secondaryButton}>
          <GoogleMark />
          Continue with Google
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ flex: 1, height: 1, background: "#DDE1E4" }} />
        <span style={{ fontFamily: s.label.fontFamily, fontSize: 11, color: "#767C83" }}>OR</span>
        <span style={{ flex: 1, height: 1, background: "#DDE1E4" }} />
      </div>

      <form action={signup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="email" style={s.label}>
            EMAIL
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required style={s.input} />
        </div>
        <div>
          <label htmlFor="password" style={s.label}>
            PASSWORD
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} style={s.input} />
        </div>
        <button type="submit" className="pm-hoverable" style={{ ...s.primaryButton, marginTop: 4 }}>
          CREATE ACCOUNT →
        </button>
      </form>
    </AuthShell>
  );
}
