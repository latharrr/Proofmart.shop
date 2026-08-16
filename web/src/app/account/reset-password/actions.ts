"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
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
  void error;
  redirect("/account/reset-password?sent=1");
}
