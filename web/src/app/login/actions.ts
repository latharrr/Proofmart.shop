"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) redirect(`/login?error=${encodeURIComponent("Sign-in is not available right now.")}`);
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  await recordAuditEvent({ userId: data.user.id, eventType: "sign_in", metadata: { method: "password" } });
  redirect("/");
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) redirect(`/login?error=${encodeURIComponent("Sign-in is not available right now.")}`);
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Could not start Google sign-in.")}`);
  }

  redirect(data.url);
}
