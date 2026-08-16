import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Fixed-window rate limiting backed by Postgres (see the `check_rate_limit`
 * function, `create_rate_limits` migration) — not an external service, not
 * in-memory. In-memory would be unreliable on Vercel's serverless runtime
 * (each invocation can land on a different, possibly cold, instance with
 * its own memory), and this app has no Redis/KV configured; Supabase is
 * already the source of truth for everything else, so one more small table
 * is cheaper than a new piece of infrastructure.
 *
 * Fails OPEN (allows the request) if Supabase isn't configured or the RPC
 * call itself errors — matching this codebase's established pattern of
 * degrading a feature rather than taking down the request path it's
 * attached to. A rate limiter that can 500 the whole app during a database
 * hiccup is worse than one that occasionally under-limits during an outage.
 */
export async function checkRateLimit(key: string, windowSeconds: number, limit: number): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return true;

  const windowStartMs = Math.floor(Date.now() / (windowSeconds * 1000)) * (windowSeconds * 1000);
  const windowStart = new Date(windowStartMs).toISOString();

  const { data, error } = await supabase.rpc("check_rate_limit", { p_key: key, p_window_start: windowStart, p_limit: limit });
  if (error) return true;
  return data === true;
}

/** Best-effort client identity for anonymous requests — Vercel sets x-forwarded-for reliably; falls back to a constant bucket (effectively a single shared limit) only when neither header is present, e.g. local dev without a proxy in front. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
