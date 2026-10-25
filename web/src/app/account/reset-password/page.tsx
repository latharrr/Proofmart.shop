import Link from "next/link";
import AuthShell, { CrossLink } from "@/components/auth/auth-shell";
import { FindingBand } from "@/components/auth/auth-stage";
import FormAlert from "@/components/auth/form-alert";
import { EmailField, SubmitButton } from "@/components/auth/fields";
import { requestPasswordReset } from "./actions";

const band = (
  <FindingBand
    line="Your documents and reports stay exactly as they are while you reset."
    points={["Links work once", "Open it in this browser"]}
  />
);

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string | string[]; busy?: string | string[] }>;
}) {
  const { sent, busy } = await searchParams;

  if (busy) {
    return (
      <AuthShell
        eyebrow="Reset link not sent"
        title="Sending is busy right now"
        subtitle="A lot of reset emails are going out at the moment, so yours couldn’t be sent just yet. Your password hasn’t changed."
        switchTo={{ label: "Sign in", href: "/login" }}
        stage={{ variant: "single", verdict: "REVIEW", label: "Not sent yet, try again shortly", band }}
        footer={<CrossLink prompt="Remembered it?" label="Back to sign in" href="/login" />}
      >
        <FormAlert
          tone="busy"
          title="No email was sent this time."
          body="Wait a few minutes, then send the link again. It usually goes through on the next try."
        />
        <p className="pm-t-body pm-auth-note">
          Ready to retry?{" "}
          <Link href="/account/reset-password" className="pm-inline-link">
            Send the link again
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Reset link requested"
        title="Check your inbox"
        subtitle="If there’s a ProofMart account for that email, a reset link is on its way. Open it in this browser to choose a new password."
        switchTo={{ label: "Sign in", href: "/login" }}
        stage={{ variant: "single", verdict: "CLEAR", label: "Nothing changes while you reset", band }}
        footer={<CrossLink prompt="Remembered it?" label="Back to sign in" href="/login" />}
      >
        <FormAlert tone="success" title="Reset link requested." body="It can take a minute to arrive. Check spam or promotions if you don’t see it." />
        <p className="pm-t-body pm-auth-note">
          Nothing arrived, or used a different address?{" "}
          <Link href="/account/reset-password" className="pm-inline-link">
            Send another link
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="Enter the email you sign in with. We’ll send a link to choose a new password."
      switchTo={{ label: "Sign in", href: "/login" }}
      stage={{ variant: "single", verdict: "CLEAR", label: "Nothing changes while you reset", band }}
      footer={<CrossLink prompt="Remembered it?" label="Back to sign in" href="/login" />}
    >
      <form action={requestPasswordReset} className="pm-auth-form">
        <EmailField restore autoFocus />
        <SubmitButton pendingLabel="Sending link">Send reset link</SubmitButton>
      </form>
      <p className="pm-t-body pm-auth-note">
        Signed up with Google? There’s no password to reset.{" "}
        <Link href="/login" className="pm-inline-link">
          Use Continue with Google
        </Link>
      </p>
    </AuthShell>
  );
}
