"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  if (!isSupabaseConfigured()) redirect(`/signup?error=${encodeURIComponent("Sign-up is not available right now.")}`);
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?check-email=1");
}

/**
 * Sends the signup confirmation email again: for a link that expired, was
 * already used, or never arrived. Lands on the check-your-inbox screen either
 * way, with `?resend=` saying how it went. Supabase answers the same for an
 * address with no pending signup, so this can't be used to probe accounts.
 */
export async function resendConfirmation(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/signup?check-email=1&resend=unavailable");
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/signup?check-email=1&resend=missing");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    const rate = /rate limit|security purposes|too many/i.test(error.message) || error.status === 429;
    redirect(`/signup?check-email=1&resend=${rate ? "rate" : "error"}`);
  }

  redirect("/signup?check-email=1&resend=sent");
}
