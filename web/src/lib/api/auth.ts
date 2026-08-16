import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { hashApiKey } from "@/lib/api-keys";

export interface ApiAuthOk {
  ok: true;
  userId: string;
  apiKeyId: string;
}

export interface ApiAuthError {
  ok: false;
  status: number;
  code: string;
  message: string;
}

export type ApiAuthResult = ApiAuthOk | ApiAuthError;

/**
 * Validates `Authorization: Bearer <key>` against api_keys.key_hash and
 * marks the key as just-used. This is the natural place a future Gate 8
 * rate limiter plugs in — it already resolves to a specific user + key
 * before any processing work happens, which is what a limiter needs to key
 * off of. Not implemented here — no half-built limiter that looks real but
 * doesn't limit anything.
 */
export async function authenticateApiRequest(request: Request): Promise<ApiAuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return { ok: false, status: 401, code: "missing_api_key", message: "Provide an API key via 'Authorization: Bearer <key>'." };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, status: 503, code: "service_unavailable", message: "API key authentication is not configured." };
  }

  const keyHash = hashApiKey(match[1].trim());
  const { data: keyRow, error } = await supabase.from("api_keys").select("id, user_id, revoked_at").eq("key_hash", keyHash).maybeSingle();

  if (error || !keyRow) {
    return { ok: false, status: 401, code: "invalid_api_key", message: "Invalid API key." };
  }
  if (keyRow.revoked_at) {
    return { ok: false, status: 401, code: "revoked_api_key", message: "This API key has been revoked." };
  }

  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

  return { ok: true, userId: keyRow.user_id, apiKeyId: keyRow.id };
}

export type UsageEventType = "verify_request" | "inspect_request" | "extract_request";

/** Best-effort — a usage-logging failure must never fail the actual API response it's logging. */
export async function recordUsageEvent(params: { apiKeyId: string; userId: string; eventType: UsageEventType }): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase
    .from("api_usage_events")
    .insert({ api_key_id: params.apiKeyId, user_id: params.userId, event_type: params.eventType })
    .then(
      () => {},
      () => {},
    );
}
