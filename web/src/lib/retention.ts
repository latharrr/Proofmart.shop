import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bounded retention for tables that are operational bookkeeping, not user
 * content a document-delete already covers (see documents/actions.ts's
 * deleteDocument, which removes the DB row and the Blob file together —
 * that's the real, user-facing retention/deletion story; this is the
 * smaller, internal-only cleanup that keeps those bookkeeping tables from
 * growing forever).
 */
const RETENTION = {
  // Fixed-window counters are meaningless past their own window; a day of
  // slack is generous, not load-bearing.
  rate_limits: { column: "window_start", days: 1 },
  // Delivery history shown on /account/webhooks — long enough to debug a
  // recent integration issue, not kept indefinitely.
  webhook_deliveries: { column: "created_at", days: 90 },
  // Security/audit trail — kept longer than delivery logs on purpose.
  audit_events: { column: "created_at", days: 180 },
} as const;

export interface RetentionResult {
  table: string;
  deleted: number;
}

export async function pruneExpiredRows(supabase: SupabaseClient): Promise<RetentionResult[]> {
  const results: RetentionResult[] = [];
  for (const [table, { column, days }] of Object.entries(RETENTION)) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { error, count } = await supabase.from(table).delete({ count: "exact" }).lt(column, cutoff);
    results.push({ table, deleted: error ? 0 : (count ?? 0) });
  }
  return results;
}
