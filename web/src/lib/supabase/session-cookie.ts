/**
 * Read-only decoding of the Supabase SSR session cookie, used by src/proxy.ts
 * to decide whether a session refresh is even worth attempting on this
 * request. These functions never verify the JWT signature — they only read
 * the expiry. Signature verification stays with getClaims() in the page and
 * route guards, which run on every protected request regardless of what the
 * proxy decides here. The worst a forged or malformed cookie can do is steer
 * the proxy into (or out of) a refresh attempt; it cannot grant access.
 */

/** atob-based base64url decode — the proxy runs on the Edge runtime, where Buffer does not exist. */
export function base64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export type CookiePair = { name: string; value: string };

/**
 * Milliseconds since the epoch at which the session cookie's access token
 * expires, or null when the cookie can't be decoded locally
 * (missing/chunked-weird/legacy/malformed). Callers must treat null as
 * "run the full refresh path".
 */
export function accessTokenExpiresAt(cookies: CookiePair[]): number | null {
  // Supabase SSR stores the session under sb-<ref>-auth-token, split into
  // .0/.1/… chunks when it outgrows one cookie. Chunk indices stay below
  // 10 in practice (a session is ~3KB and a cookie holds ~4KB), so plain
  // lexicographic order assembles them correctly.
  const chunks = cookies
    .filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (chunks.length === 0) return null;
  try {
    let value = decodeURIComponent(chunks.map((c) => c.value).join(""));
    if (value.startsWith("base64-")) {
      value = base64urlDecode(value.slice(7));
    }
    const session = JSON.parse(value);
    const token = typeof session?.access_token === "string" ? session.access_token : null;
    if (!token) return null;
    const payload = JSON.parse(base64urlDecode(token.split(".")[1]));
    return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * The proxy's refresh decision: skip the updateSession network work only
 * when a locally decoded access token still has more than `windowMs` to
 * live. Anything undecodable, expired, or inside the window returns false
 * (run the full refresh path, exactly as before this optimization).
 */
export function shouldSkipSessionRefresh(cookies: CookiePair[], nowMs: number, windowMs: number): boolean {
  const expMs = accessTokenExpiresAt(cookies);
  return expMs !== null && expMs - nowMs > windowMs;
}
