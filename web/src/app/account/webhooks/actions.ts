"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkUrlShape } from "@/lib/webhooks/url-safety";

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function createWebhook(url: string): Promise<{ id: string; secret: string } | { error: string }> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };

  const trimmed = url.trim();
  const shape = checkUrlShape(trimmed);
  if (!shape.safe) return { error: shape.reason ?? "That URL isn't allowed." };

  const secret = `whsec_${randomBytes(24).toString("base64url")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.from("webhook_endpoints").insert({ user_id: userId, url: trimmed, secret }).select("id").single();
  if (error || !data) return { error: error?.message ?? "Could not create webhook." };

  revalidatePath("/account/webhooks");
  return { id: data.id, secret };
}

export async function toggleWebhook(id: string, enabled: boolean): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = await createClient();
  await supabase.from("webhook_endpoints").update({ enabled }).eq("id", id).eq("user_id", userId);
  revalidatePath("/account/webhooks");
}

export async function deleteWebhook(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = await createClient();
  await supabase.from("webhook_endpoints").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/account/webhooks");
}
