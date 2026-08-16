import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses Row Level Security entirely. Used only for
 * operations that legitimately run outside any single user's session:
 * validating a bearer API key (the caller has no Supabase session, just a
 * key) and writing usage events (api_usage_events grants no insert policy
 * to any user role — see its migration — specifically so a client can never
 * fabricate its own usage history). Never import this into anything that
 * renders in the browser or runs with a user's own session context.
 *
 * Returns null rather than throwing when unconfigured, matching this repo's
 * pattern elsewhere (Blob, Google OAuth) of degrading a feature rather than
 * crashing the request — callers decide what "API auth unavailable" means
 * for their route.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
