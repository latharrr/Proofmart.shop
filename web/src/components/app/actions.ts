"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";

/**
 * Sign-out for the signed-in app shell. Same sequence as the marketing
 * topbar's inline action (components/home/auth-controls.tsx): end the
 * session, record it, drop every cached layout, go home.
 */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    await supabase.auth.signOut();
    await recordAuditEvent({ userId, eventType: "sign_out" });
  }
  revalidatePath("/", "layout");
  redirect("/");
}
