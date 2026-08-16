import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { logAudit } from "@/lib/observability/log";

export type AuditEventType =
  | "sign_in"
  | "sign_out"
  | "document_uploaded"
  | "verification_completed"
  | "document_deleted"
  | "document_rerun"
  | "api_key_created"
  | "api_key_revoked"
  | "webhook_created"
  | "webhook_updated"
  | "webhook_deleted"
  | "password_reset_requested"
  | "password_updated";

/**
 * Records a structured audit event — metadata only (ids, counts, booleans),
 * never document contents, OCR text, or secrets; every call site in this
 * codebase is responsible for only ever passing that kind of value in
 * `metadata`. Best-effort: an audit-logging failure must never fail the
 * user-facing action it's recording, same principle as recordUsageEvent in
 * lib/api/auth.ts.
 */
export async function recordAuditEvent(params: {
  userId: string | null;
  eventType: AuditEventType;
  metadata?: Record<string, string | number | boolean | null>;
  ipAddress?: string;
}): Promise<void> {
  logAudit({ eventType: params.eventType, userId: params.userId, metadata: params.metadata });

  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase
    .from("audit_events")
    .insert({ user_id: params.userId, event_type: params.eventType, metadata: params.metadata ?? {}, ip_address: params.ipAddress ?? null })
    .then(
      () => {},
      () => {},
    );
}
