import "server-only";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { attemptDelivery } from "./deliver";

export type WebhookEventType = "verification.completed" | "verification.failed";

/**
 * Fires an event to every enabled webhook the user has registered. Runs the
 * actual delivery attempt in `after()` — code that executes once the
 * response has already been sent — so a slow or unreachable customer
 * endpoint never adds latency to /v1/verify's response. A retry sweep
 * (/api/webhooks/sweep, see deliver.ts) picks up anything this immediate
 * attempt didn't finish successfully.
 */
export async function dispatchWebhookEvent(params: {
  userId: string;
  eventType: WebhookEventType;
  verificationId: string;
  result: Record<string, unknown>;
}): Promise<void> {
  const service = createServiceClient();
  if (!service) return;

  const { data: endpoints } = await service.from("webhook_endpoints").select("id").eq("user_id", params.userId).eq("enabled", true);
  if (!endpoints || endpoints.length === 0) return;

  const createdAt = new Date().toISOString();
  const rows = endpoints.map((e) => {
    const id = randomUUID();
    return {
      id,
      webhook_endpoint_id: e.id,
      user_id: params.userId,
      event_type: params.eventType,
      verification_id: params.verificationId,
      // Body actually POSTed to the customer's URL — event id, event type,
      // timestamp, verification id, result. The signature travels as a
      // header (x-proofmart-signature, see deliver.ts) rather than a body
      // field, so the receiver can hash the raw body as-received without
      // first stripping a self-referential field out of it.
      payload: { id, type: params.eventType, createdAt, verificationId: params.verificationId, result: params.result },
    };
  });

  const { data: inserted } = await service.from("webhook_deliveries").insert(rows).select("id");
  if (!inserted || inserted.length === 0) return;

  after(async () => {
    await Promise.all(inserted.map((row) => attemptDelivery(service, row.id)));
  });
}
