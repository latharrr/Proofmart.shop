import Link from "next/link";
import AuthShell, { CrossLink, OrDivider } from "@/components/auth/auth-shell";
import { BenefitList } from "@/components/auth/auth-aside";
import GoogleMark from "@/components/auth/google-mark";
import FormAlert from "@/components/auth/form-alert";
import { EmailField, PasswordField, SubmitButton } from "@/components/auth/fields";
import { signupError } from "@/components/auth/auth-errors";
import { signup } from "./actions";
import { signInWithGoogle } from "@/app/login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; "check-email"?: string }>;
}) {
  const params = await searchParams;

  if (params["check-email"]) {
    return (
      <AuthShell
        title={
          <>
            Check your <em>inbox</em>
          </>
        }
        subtitle="We’ve sent you a confirmation link. Open it on this device and you’ll land in ProofMart, signed in."
        aside="signup"
        footer={<CrossLink prompt="Already confirmed?" label="Sign in" href="/login" />}
      >
        <FormAlert
          tone="success"
          title="Account created — one step left."
          body="If it isn’t in your inbox within a minute, check spam or promotions."
        />
        <p className="pm-caption pm-auth-note">
          Typed the wrong address?{" "}
          <Link href="/signup" className="pm-link pm-auth-xlink">
            Start again
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </Link>
        </p>
      </AuthShell>
    );
  }

  const err = params.error ? signupError(params.error) : null;
  const atGoogle = err?.field === "google";
  const atForm = err && !atGoogle;

  return (
    <AuthShell
      title={
        <>
          Create your <em>free</em> account
        </>
      }
      subtitle="Free to start, with 50 verify calls a month. No card needed."
      aside="signup"
      footer={<CrossLink prompt="Already have an account?" label="Sign in" href="/login" />}
      below={
        <div className="pm-auth-below">
          <p className="pm-eyebrow" style={{ marginBottom: 12 }}>
            What you get
          </p>
          <BenefitList compact />
        </div>
      }
    >
      <form action={signInWithGoogle} className="pm-auth-form">
        <SubmitButton variant="ghost" icon={<GoogleMark />} pendingLabel="Opening Google…">
          Sign up with Google
        </SubmitButton>
        {atGoogle && <FormAlert tone="error" title={err.title} body={err.body} action={err.action} />}
      </form>

      <OrDivider />

      <form action={signup} className="pm-auth-form">
        {atForm && <FormAlert id="signup-error" tone="error" title={err.title} body={err.body} action={err.action} />}
        <EmailField
          restore={!!err}
          invalid={err?.field === "email"}
          describedBy={atForm ? "signup-error" : undefined}
          autoFocus={err?.field === "email"}
        />
        <PasswordField
          label="Create a password"
          autoComplete="new-password"
          minLength={6}
          hint="At least 6 characters."
          invalid={err?.field === "password"}
          describedBy={atForm ? "signup-error" : undefined}
          autoFocus={err?.field === "password"}
        />
        <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
        <p className="pm-caption pm-auth-note">We’ll email you a link to confirm the address. That’s the only step after this.</p>
      </form>
    </AuthShell>
  );
}
