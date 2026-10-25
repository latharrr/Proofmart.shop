import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JWK } from "@supabase/auth-js";
import { cookies } from "next/headers";

export { isSupabaseConfigured } from "./config";

// getClaims() verifies the JWT locally but fetches the project's JWKS the
// first time each client instance needs it — and this file deliberately
// creates a fresh client per request, so every guarded page paid a full
// auth round trip just to re-download the same key set. Cache it at module
// scope (one per warm function instance) with the same 10-minute TTL the
// auth client uses internally. Rotation is safe: fetchJwk falls through to
// a fresh fetch when the token's kid isn't in the set we hand it.
const JWKS_TTL_MS = 10 * 60 * 1000;
let jwksCache: { jwks: { keys: JWK[] }; at: number } | null = null;

/** Only a structurally valid, non-empty key set may enter the 10-minute cache — a malformed 200 body must not poison it. */
function isValidJwks(data: unknown): data is { keys: JWK[] } {
  if (typeof data !== "object" || data === null) return false;
  const keys = (data as { keys?: unknown }).keys;
  return (
    Array.isArray(keys) &&
    keys.length > 0 &&
    keys.every((k) => typeof k === "object" && k !== null && typeof (k as JWK).kid === "string" && typeof (k as JWK).kty === "string")
  );
}

async function sharedJwks(): Promise<{ keys: JWK[] } | undefined> {
  if (jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) return jwksCache.jwks;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
    if (!res.ok) return undefined;
    const body: unknown = await res.json();
    if (!isValidJwks(body)) return undefined; // do NOT cache — next request tries again
    jwksCache = { jwks: body, at: Date.now() };
    return body;
  } catch {
    return undefined; // fall back to the client's own fetch path
  }
}

/**
 * supabase.auth.getClaims() without the per-request JWKS download. Same
 * security properties — signature verification still runs against the
 * fetched key set, and a miss (key rotation) makes the client fetch fresh.
 */
export async function getVerifiedClaims(supabase: SupabaseClient) {
  const jwks = await sharedJwks();
  return supabase.auth.getClaims(undefined, jwks ? { jwks } : undefined);
}

// For Server Components, Server Actions, and Route Handlers. A fresh client
// per call is intentional/cheap (server-side it just configures a fetch
// call) — it needs this request's own cookies, so it can't be a singleton.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, which can't write cookies —
          // safe to ignore since proxy.ts refreshes the session on every
          // request instead.
        }
      },
    },
  });
}
