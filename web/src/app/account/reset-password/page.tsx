import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import * as s from "@/components/auth/auth-styles";
import { requestPasswordReset } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="pm-hoverable" style={{ color: "#0E1216", textDecoration: "underline" }}>
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div style={s.successBanner}>If an account exists for that email, a reset link is on its way.</div>
      ) : (
        <form action={requestPasswordReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="email" style={s.label}>
              EMAIL
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required style={s.input} />
          </div>
          <button type="submit" className="pm-hoverable" style={s.primaryButton}>
            SEND RESET LINK →
          </button>
        </form>
      )}
    </AuthShell>
  );
}
