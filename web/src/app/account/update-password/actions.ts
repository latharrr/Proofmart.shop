"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/account/update-password?error=${encodeURIComponent(error.message)}`);
  }

  await recordAuditEvent({ userId: data.user.id, eventType: "password_updated" });
  redirect("/");
}
