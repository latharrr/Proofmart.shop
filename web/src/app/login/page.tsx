import Link from "next/link";
import AuthShell, { CrossLink, OrDivider } from "@/components/auth/auth-shell";
import GoogleMark from "@/components/auth/google-mark";
import FormAlert from "@/components/auth/form-alert";
import { EmailField, PasswordField, SubmitButton } from "@/components/auth/fields";
import { loginError } from "@/components/auth/auth-errors";
import { login, signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const err = error ? loginError(error) : null;
  const atGoogle = err?.field === "google";
  const atForm = err && !atGoogle;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Get back to your documents, reports and API keys."
      aside="return"
      footer={<CrossLink prompt="New to ProofMart?" label="Create a free account" href="/signup" />}
    >
      <form action={signInWithGoogle} className="pm-auth-form">
        <SubmitButton variant="ghost" icon={<GoogleMark />} pendingLabel="Opening Google…">
          Continue with Google
        </SubmitButton>
        {atGoogle && <FormAlert tone="error" title={err.title} body={err.body} action={err.action} />}
      </form>

      <OrDivider />

      <form action={login} className="pm-auth-form">
        {atForm && <FormAlert id="login-error" tone="error" title={err.title} body={err.body} action={err.action} />}
        <EmailField
          restore={!!err}
          invalid={err?.field === "email"}
          describedBy={atForm ? "login-error" : undefined}
          autoFocus={err?.field === "email"}
        />
        <PasswordField
          autoComplete="current-password"
          invalid={err?.field === "password"}
          describedBy={atForm ? "login-error" : undefined}
          autoFocus={err?.field === "password"}
          after={
            <Link href="/account/reset-password" className="pm-link pm-auth-forgot">
              Forgot password?
            </Link>
          }
        />
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}
