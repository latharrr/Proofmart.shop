import "server-only";

/**
 * Structured JSON-line logging to stdout — Vercel captures and indexes
 * every stdout line from a serverless function as a runtime log automatically
 * (see get_runtime_logs/get_runtime_errors), so this needs no external
 * platform (Sentry, Datadog, etc.) to be queryable in production. If this
 * project ever adds one of those, this is the one place that would change.
 *
 * Never pass document contents, OCR text, API keys, or secrets in `fields` —
 * this is the boundary between "safe to log" and everything upstream of it
 * that isn't. Every call site in this codebase only passes counts, ids,
 * durations, and enum-like category strings.
 */
export interface RequestLogFields {
  requestId: string;
  route: string;
  method: string;
  status: number;
  durationMs: number;
  userId?: string;
  apiKeyId?: string;
  processingTimeMs?: number;
  pageCount?: number;
  failureCategory?: string;
  [key: string]: string | number | boolean | undefined;
}

export function logRequest(fields: RequestLogFields): void {
  console.log(JSON.stringify({ level: "info", type: "request", ts: new Date().toISOString(), ...fields }));
}

export interface AuditFields {
  eventType: string;
  userId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export function logAudit(fields: AuditFields): void {
  console.log(JSON.stringify({ level: "info", type: "audit", ts: new Date().toISOString(), ...fields }));
}
