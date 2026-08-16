// Whether Supabase env vars are present — checked before any code path
// that would otherwise throw synchronously without them (createServerClient
// itself, and everything built on it). Deliberately has zero framework
// imports: proxy.ts (Proxy/Middleware runtime) can't import next/headers,
// which server.ts pulls in, so this needs to be its own module rather than
// exported alongside createClient there.
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
