"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";

export async function requestPasswordReset(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/account/reset-password?sent=1");
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/account/update-password`,
  });

  // Always show the same confirmation regardless of whether the email
  // exists — an error here would let anyone probe which emails have
  // accounts. A real send failure (bad SMTP config, etc.) is a server-side
  // problem to catch in logs, not something to surface to the requester.
  // userId is deliberately null (unresolved) for the same reason — looking
  // the email up ourselves just to attach a userId reopens the exact
  // enumeration surface this whole function exists to avoid.
  void error;
  await recordAuditEvent({ userId: null, eventType: "password_reset_requested", metadata: { email } });
  redirect("/account/reset-password?sent=1");
}
