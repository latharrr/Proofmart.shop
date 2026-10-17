import Link from "next/link";
import AuthShell, { CrossLink, OrDivider } from "@/components/auth/auth-shell";
import { BenefitList } from "@/components/auth/auth-stage";
import GoogleMark from "@/components/auth/google-mark";
import FormAlert from "@/components/auth/form-alert";
import { EmailField, PasswordField, SubmitButton } from "@/components/auth/fields";
import { resendNotice, signupError } from "@/components/auth/auth-errors";
import { resendConfirmation, signup } from "./actions";
import { signInWithGoogle } from "@/app/login/actions";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const benefitsBand = (
  <>
    <p className="pm-t-label pm-auth-band-kicker">Free plan · ₹0 a month · no card</p>
    <BenefitList className="pm-auth-benefits-band" />
  </>
);

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; "check-email"?: string | string[]; resend?: string | string[] }>;
}) {
  const params = await searchParams;

  if (one(params["check-email"])) {
    const notice = resendNotice(one(params.resend));
    return (
      <AuthShell
        eyebrow="One step left"
        title="Check your inbox"
        subtitle="We’ve emailed you a confirmation link. Open it in this browser and you’ll land in ProofMart, signed in."
        switchTo={{ label: "Sign in", href: "/login" }}
        stage={{ variant: "stack", verdict: "CLEAR", label: "What you get", band: benefitsBand }}
        footer={<CrossLink prompt="Already confirmed?" label="Sign in" href="/login" />}
      >
        {!notice && (
          <FormAlert
            tone="success"
            title="Account created. Confirm your email to finish."
            body="Nothing within a minute? Check spam or promotions, or send it again below."
          />
        )}

        <form action={resendConfirmation} className="pm-auth-form pm-auth-panel">
          <p className="pm-t-label pm-auth-panel-title">Didn’t get it, or the link expired?</p>
          <EmailField
            restore
            label="Email you signed up with"
            invalid={one(params.resend) === "missing" || one(params.resend) === "error"}
            describedBy={notice ? "resend-notice" : undefined}
            error={notice && <FormAlert id="resend-notice" tone={notice.tone} title={notice.title} body={notice.body} />}
          />
          <SubmitButton variant="secondary" pendingLabel="Sending">
            Resend confirmation email
          </SubmitButton>
        </form>

        <p className="pm-t-body pm-auth-note">
          Typed the wrong address?{" "}
          <Link href="/signup" className="pm-inline-link">
            Start again
          </Link>
        </p>
      </AuthShell>
    );
  }

  const error = one(params.error);
  // The query text is only matched against known causes, never printed.
  const err = error ? signupError(error) : null;
  const alert = (id: string) => err && <FormAlert id={id} tone="error" title={err.title} body={err.body} action={err.action} />;

  return (
    <AuthShell
      eyebrow="Free to start"
      title="Sign up"
      subtitle="50 verify calls a month on the free plan. No card, one confirmation email."
      switchTo={{ label: "Sign in", href: "/login" }}
      stage={{ variant: "stack", verdict: "FAIL", label: "What you get", band: benefitsBand }}
      footer={<CrossLink prompt="Already have an account?" label="Sign in" href="/login" />}
    >
      <form action={signInWithGoogle} className="pm-auth-form">
        <SubmitButton variant="paper" icon={<GoogleMark />} dot={false} pendingLabel="Opening Google">
          Sign up with Google
        </SubmitButton>
        {err?.field === "google" && alert("signup-google-error")}
      </form>

      <OrDivider />

      <form action={signup} className="pm-auth-form">
        {err?.field === "form" && alert("signup-error")}
        <EmailField
          restore={!!err}
          invalid={err?.field === "email"}
          describedBy={err?.field === "email" ? "signup-email-error" : undefined}
          autoFocus={err?.field === "email"}
          error={err?.field === "email" && alert("signup-email-error")}
        />
        <PasswordField
          label="Create a password"
          autoComplete="new-password"
          minLength={6}
          hint="At least 6 characters."
          invalid={err?.field === "password"}
          describedBy={err?.field === "password" ? "signup-password-error" : undefined}
          autoFocus={err?.field === "password"}
          error={err?.field === "password" && alert("signup-password-error")}
        />
        <SubmitButton pendingLabel="Creating your account">Create account</SubmitButton>
      </form>
      <p className="pm-t-body pm-auth-note">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="pm-inline-link">
          Terms of service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="pm-inline-link">
          Privacy policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}
