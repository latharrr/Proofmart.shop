import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/auth-shell";
import * as s from "@/components/auth/auth-styles";
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

  return (
    <AuthShell title="Set a new password">
      {error && <div style={s.errorBanner}>{error}</div>}
      <form action={updatePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="password" style={s.label}>
            New password
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} style={s.input} />
        </div>
        <button type="submit" className="pm-btn pm-btn-filled" style={s.primaryButton}>
          Update password
        </button>
      </form>
    </AuthShell>
  );
}
