import Link from "next/link";
import AuthShell, { CrossLink, OrDivider } from "@/components/auth/auth-shell";
import { FindingBand } from "@/components/auth/auth-stage";
import GoogleMark from "@/components/auth/google-mark";
import FormAlert from "@/components/auth/form-alert";
import { EmailField, PasswordField, ResendButton, SubmitButton } from "@/components/auth/fields";
import { loginError } from "@/components/auth/auth-errors";
import { resendConfirmation } from "@/app/signup/actions";
import { login, signInWithGoogle } from "./actions";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const error = one((await searchParams).error);
  // The query text is only matched against known causes, never printed.
  const err = error ? loginError(error) : null;
  const alert = (id: string) =>
    err && (
      <FormAlert id={id} tone="error" title={err.title} body={err.body} action={err.action}>
        {err.resend && <ResendButton action={resendConfirmation} />}
      </FormAlert>
    );

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Pick up your documents, reports and API keys where you left them."
      switchTo={{ label: "Sign up", href: "/signup" }}
      stage={{
        variant: "stack",
        verdict: "FAIL",
        label: "Your last report",
        band: (
          <FindingBand
            line="Every finding pinned to its box, with the arithmetic behind the verdict."
            marker="BALANCE_BREAK · p4·r17"
            arithmetic={<>84,210.00 + 12,500.00 = 96,710.00 ≠ 91,710.00</>}
          />
        ),
      }}
      footer={<CrossLink prompt="New to ProofMart?" label="Create a free account" href="/signup" />}
    >
      <form action={signInWithGoogle} className="pm-auth-form">
        <SubmitButton variant="paper" icon={<GoogleMark />} dot={false} pendingLabel="Opening Google">
          Continue with Google
        </SubmitButton>
        {err?.field === "google" && alert("login-google-error")}
      </form>

      <OrDivider />

      <form action={login} className="pm-auth-form">
        {err?.field === "form" && alert("login-error")}
        <EmailField
          restore={!!err}
          invalid={err?.field === "email"}
          describedBy={err?.field === "email" ? "login-email-error" : undefined}
          autoFocus={err?.field === "email"}
          error={err?.field === "email" && alert("login-email-error")}
        />
        <PasswordField
          autoComplete="current-password"
          invalid={err?.field === "password"}
          describedBy={err?.field === "password" ? "login-password-error" : undefined}
          autoFocus={err?.field === "password"}
          error={err?.field === "password" && alert("login-password-error")}
          aside={
            <Link href="/account/reset-password" className="pm-inline-link pm-auth-forgot">
              Forgot password?
            </Link>
          }
        />
        <SubmitButton pendingLabel="Signing in">Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}
