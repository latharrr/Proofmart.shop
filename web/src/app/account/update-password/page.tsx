import { redirect } from "next/navigation";
import AuthShell, { CrossLink } from "@/components/auth/auth-shell";
import FormAlert from "@/components/auth/form-alert";
import { PasswordField, SubmitButton } from "@/components/auth/fields";
import { updatePasswordError } from "@/components/auth/auth-errors";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!isSupabaseConfigured()) redirect("/account/reset-password");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/account/reset-password");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  const err = error ? updatePasswordError(error) : null;

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={
        email ? (
          <>
            For <strong className="pm-auth-strong">{email}</strong>. You’ll stay signed in once it’s saved.
          </>
        ) : (
          "You’ll stay signed in once it’s saved."
        )
      }
      aside="return"
      footer={<CrossLink prompt="Changed your mind?" label="Back to home" href="/" />}
    >
      <form action={updatePassword} className="pm-auth-form">
        {err && <FormAlert id="update-error" tone="error" title={err.title} body={err.body} action={err.action} />}
        {/* Lets password managers file the new password under the right account. */}
        {email && <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          minLength={6}
          hint="At least 6 characters."
          invalid={err?.field === "password"}
          describedBy={err ? "update-error" : undefined}
          autoFocus
        />
        <SubmitButton pendingLabel="Saving…">Save new password</SubmitButton>
      </form>
    </AuthShell>
  );
}
