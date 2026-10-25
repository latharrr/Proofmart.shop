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

  // Rate limited (project email cap hit): no email was sent, so telling the
  // requester to check their inbox would be a lie. Send them to a busy
  // state instead. Enumeration-safe: the project-level email bucket trips
  // regardless of whether the address has an account, so this reveals
  // nothing about the address. Every other error keeps the silent path
  // below on purpose.
  // Record the request in the audit log for every outcome, including
  // rate-limited ones — the busy state below must not swallow the trail.
  // userId is deliberately null (unresolved): looking the email up
  // ourselves just to attach a userId reopens the exact enumeration
  // surface this whole function exists to avoid.
  await recordAuditEvent({ userId: null, eventType: "password_reset_requested", metadata: { email } });

  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
    redirect("/account/reset-password?busy=1");
  }

  // Always show the same confirmation for any other outcome. An error here
  // would let anyone probe which emails have accounts, and a real send
  // failure (bad SMTP config, etc.) is a server-side problem to catch in
  // logs, not something to surface to the requester.
  void error;
  redirect("/account/reset-password?sent=1");
}
