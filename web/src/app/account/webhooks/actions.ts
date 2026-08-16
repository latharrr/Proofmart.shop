"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkUrlShape } from "@/lib/webhooks/url-safety";
import { recordAuditEvent } from "@/lib/audit";

// A ceiling, not a plan limit — stops one account from registering an
// unbounded number of endpoints and turning every /v1/verify call into an
// unbounded fan-out of outbound requests.
const MAX_WEBHOOKS_PER_USER = 10;

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

  const supabase = await createClient();
  const { count } = await supabase.from("webhook_endpoints").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) >= MAX_WEBHOOKS_PER_USER) return { error: `You can register at most ${MAX_WEBHOOKS_PER_USER} webhooks.` };

  const secret = `whsec_${randomBytes(24).toString("base64url")}`;
  const { data, error } = await supabase.from("webhook_endpoints").insert({ user_id: userId, url: trimmed, secret }).select("id").single();
  if (error || !data) {
    console.error("[webhooks] create failed:", error?.message);
    return { error: "Could not create webhook." };
  }

  await recordAuditEvent({ userId, eventType: "webhook_created", metadata: { webhookId: data.id } });
  revalidatePath("/account/webhooks");
  return { id: data.id, secret };
}

export async function toggleWebhook(id: string, enabled: boolean): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = await createClient();
  await supabase.from("webhook_endpoints").update({ enabled }).eq("id", id).eq("user_id", userId);
  await recordAuditEvent({ userId, eventType: "webhook_updated", metadata: { webhookId: id, enabled } });
  revalidatePath("/account/webhooks");
}

export async function deleteWebhook(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const supabase = await createClient();
  await supabase.from("webhook_endpoints").delete().eq("id", id).eq("user_id", userId);
  await recordAuditEvent({ userId, eventType: "webhook_deleted", metadata: { webhookId: id } });
  revalidatePath("/account/webhooks");
}
