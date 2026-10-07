import Link from "next/link";
import AuthShell, { CrossLink } from "@/components/auth/auth-shell";
import FormAlert from "@/components/auth/form-alert";
import { EmailField, SubmitButton } from "@/components/auth/fields";
import { requestPasswordReset } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If there’s a ProofMart account for that email, a reset link is on its way. Open it in this browser to choose a new password."
        aside="return"
        footer={<CrossLink prompt="Remembered it?" label="Back to sign in" href="/login" />}
      >
        <FormAlert tone="success" title="Reset link requested." body="It can take a minute to arrive. Check spam or promotions if you don’t see it." />
        <p className="pm-caption pm-auth-note">
          Nothing arrived, or used a different address?{" "}
          <Link href="/account/reset-password" className="pm-link pm-auth-xlink">
            Send another link
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you sign in with. We’ll send a link to choose a new password."
      aside="return"
      footer={<CrossLink prompt="Remembered it?" label="Back to sign in" href="/login" />}
    >
      <form action={requestPasswordReset} className="pm-auth-form">
        <EmailField restore autoFocus />
        <SubmitButton pendingLabel="Sending link…">Send reset link</SubmitButton>
        <p className="pm-caption pm-auth-note">Signed up with Google? There’s no password to reset — sign in with Continue with Google instead.</p>
      </form>
    </AuthShell>
  );
}
