"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-keys";
import { recordAuditEvent } from "@/lib/audit";

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function createApiKey(name: string): Promise<{ rawKey: string } | { error: string }> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };

  const trimmedName = name.trim() || "Untitled key";
  const { raw, prefix, hash } = generateApiKey();

  const supabase = await createClient();
  const { data, error } = await supabase.from("api_keys").insert({ user_id: userId, name: trimmedName, key_prefix: prefix, key_hash: hash }).select("id").single();
  if (error || !data) {
    // Never forward the raw Postgres error text to the client.
    console.error("[api-keys] create failed:", error?.message);
    return { error: "Could not create API key." };
  }

  await recordAuditEvent({ userId, eventType: "api_key_created", metadata: { apiKeyId: data.id, name: trimmedName } });
  revalidatePath("/account/api-keys");
  return { rawKey: raw };
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  const supabase = await createClient();
  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId).eq("user_id", userId);

  await recordAuditEvent({ userId, eventType: "api_key_revoked", metadata: { apiKeyId: keyId } });
  revalidatePath("/account/api-keys");
}
