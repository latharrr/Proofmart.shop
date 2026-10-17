import { redirect } from "next/navigation";
import AuthShell, { CrossLink } from "@/components/auth/auth-shell";
import { FindingBand } from "@/components/auth/auth-stage";
import FormAlert from "@/components/auth/form-alert";
import { PasswordField, SubmitButton } from "@/components/auth/fields";
import { updatePasswordError } from "@/components/auth/auth-errors";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const error = one((await searchParams).error);

  if (!isSupabaseConfigured()) redirect("/account/reset-password");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/account/reset-password");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  // The query text is only matched against known causes, never printed.
  const err = error ? updatePasswordError(error) : null;
  const alert = (id: string) => err && <FormAlert id={id} tone="error" title={err.title} body={err.body} action={err.action} />;

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Choose a new password"
      subtitle={
        email ? (
          <>
            For <span className="pm-auth-strong">{email}</span>. You’ll stay signed in once it’s saved.
          </>
        ) : (
          "You’ll stay signed in once it’s saved."
        )
      }
      stage={{
        variant: "single",
        verdict: "CLEAR",
        label: "Your reports are waiting",
        band: (
          <FindingBand
            line="Save it and you’re straight back to your documents."
            points={["At least 6 characters", "You stay signed in"]}
          />
        ),
      }}
      footer={<CrossLink prompt="Changed your mind?" label="Back to home" href="/" />}
    >
      <form action={updatePassword} className="pm-auth-form">
        {err?.field !== "password" && alert("update-error")}
        {/* Lets password managers file the new password under the right account. */}
        {email && <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          minLength={6}
          hint="At least 6 characters."
          invalid={err?.field === "password"}
          describedBy={err ? "update-error" : undefined}
          error={err?.field === "password" && alert("update-error")}
          autoFocus
        />
        <SubmitButton pendingLabel="Saving">Save new password</SubmitButton>
      </form>
    </AuthShell>
  );
}
