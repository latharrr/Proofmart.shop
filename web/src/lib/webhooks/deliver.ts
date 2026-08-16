import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { signWebhookBody } from "./hmac";
import { resolveAndCheck } from "./url-safety";

/** Delay before each retry, indexed by (attempt_count - 1) at the moment the retry is scheduled — i.e. the first entry is the wait after the initial (immediate) attempt fails. Five retries over ~13 hours, then exhausted. */
const RETRY_DELAYS_MINUTES = [1, 5, 30, 120, 720];

export const MAX_ATTEMPTS = RETRY_DELAYS_MINUTES.length + 1;

interface DeliveryRow {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempt_count: number;
  webhook_endpoints: { url: string; secret: string; enabled: boolean } | null;
}

/**
 * Attempts one delivery of one `webhook_deliveries` row and writes the
 * outcome back — used both for the immediate best-effort attempt right
 * after a verification completes (see dispatch.ts) and for the retry sweep
 * (/api/webhooks/sweep). Never throws: every failure mode (disabled
 * endpoint, unsafe URL, network error, non-2xx response, timeout) is
 * recorded on the row instead, so a caller can fire-and-forget this.
 */
export async function attemptDelivery(supabase: SupabaseClient, deliveryId: string): Promise<void> {
  const { data: delivery } = await supabase
    .from("webhook_deliveries")
    .select("id, event_type, payload, attempt_count, webhook_endpoints(url, secret, enabled)")
    .eq("id", deliveryId)
    .maybeSingle<DeliveryRow>();
  if (!delivery || !delivery.webhook_endpoints) return;

  const endpoint = delivery.webhook_endpoints;
  const now = new Date().toISOString();

  if (!endpoint.enabled) {
    await supabase.from("webhook_deliveries").update({ status: "failed", last_error: "Webhook endpoint is disabled.", last_attempted_at: now, next_retry_at: null }).eq("id", deliveryId);
    return;
  }

  const urlCheck = await resolveAndCheck(endpoint.url);
  if (!urlCheck.safe && !urlCheck.retryable) {
    // Definitively unsafe (private IP, blocked host, bad scheme) — never
    // retry, no matter how many attempts remain. Unlike every other
    // terminal/retry decision below, this one is about the destination
    // itself, not this attempt, so it skips attempt_count entirely.
    await supabase.from("webhook_deliveries").update({ status: "failed", last_error: urlCheck.reason ?? "URL failed safety check.", last_attempted_at: now, next_retry_at: null }).eq("id", deliveryId);
    return;
  }

  const rawBody = JSON.stringify(delivery.payload);
  const signature = signWebhookBody(rawBody, endpoint.secret);
  const attemptNumber = delivery.attempt_count + 1;

  let responseStatus: number | null = null;
  let errorMessage: string | null = null;
  if (!urlCheck.safe) {
    // Retryable safety-check failure (DNS timeout, transient resolution
    // error) — counts as a failed attempt like any other, falls through to
    // the same backoff scheduling below rather than a real fetch.
    errorMessage = urlCheck.reason ?? "Could not verify the destination URL's safety.";
  } else {
    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        // Manual, not "follow" (fetch's default): a 3xx response is a live
        // network round-trip this server would otherwise make automatically,
        // to a destination that never went through resolveAndCheck above —
        // exactly the SSRF gap that check exists to close. A receiving
        // endpoint that wants to move should update its registered URL, not
        // rely on us following a redirect to wherever it points today.
        redirect: "manual",
        headers: {
          "content-type": "application/json",
          "x-proofmart-event": delivery.event_type,
          "x-proofmart-delivery": delivery.id,
          "x-proofmart-signature": signature,
        },
        body: rawBody,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
        errorMessage = "Receiving endpoint returned a redirect, which is not followed (SSRF protection).";
      } else {
        responseStatus = res.status;
        if (!res.ok) errorMessage = `Receiving endpoint returned HTTP ${res.status}.`;
      }
    } catch (err) {
      errorMessage = err instanceof Error && err.name === "TimeoutError" ? "Request timed out after 10s." : "Network error delivering webhook.";
    }
  }

  if (responseStatus !== null && responseStatus >= 200 && responseStatus < 300) {
    await supabase
      .from("webhook_deliveries")
      .update({ status: "success", attempt_count: attemptNumber, last_attempted_at: now, last_response_status: responseStatus, last_error: null, next_retry_at: null })
      .eq("id", deliveryId);
    return;
  }

  const nextDelay = RETRY_DELAYS_MINUTES[attemptNumber - 1];
  const exhausted = nextDelay === undefined;
  await supabase
    .from("webhook_deliveries")
    .update({
      status: exhausted ? "exhausted" : "pending",
      attempt_count: attemptNumber,
      last_attempted_at: now,
      last_response_status: responseStatus,
      last_error: errorMessage,
      next_retry_at: exhausted ? null : new Date(Date.now() + nextDelay * 60_000).toISOString(),
    })
    .eq("id", deliveryId);
}
