import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";
import { isBackslashV1Path } from "@/lib/api/backslash-guard";

export async function proxy(request: NextRequest) {
  // Runs before routing (and before the Supabase gate below): a backslash in
  // a /v1/* path 500s inside Next's route matching on Vercel before the
  // [...path] catch-all is consulted, so answer it here with the same JSON
  // 404 the catch-all returns for every other unknown /v1 path.
  if (isBackslashV1Path(request.nextUrl.pathname)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  // createServerClient (inside updateSession) throws synchronously if
  // Supabase isn't configured yet — this runs on nearly every request
  // (see the matcher below), so an unconfigured deploy must pass requests
  // through untouched, not 500 on every single page.
  if (!isSupabaseConfigured()) return NextResponse.next();

  // Anonymous requests carry no Supabase auth cookies, so there is no
  // session to refresh: skip the Supabase client entirely. This keeps
  // public marketing responses free of Set-Cookie and cacheable at the
  // CDN, and the browser-side Supabase client (header-auth.tsx) owns
  // session freshness on public pages for signed-in visitors. Any request
  // that DOES carry auth cookies still gets the full refresh below, so
  // protected pages and API routes behave exactly as before.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) return NextResponse.next();

  // updateSession's only request-visible job is refreshing a session whose
  // access token is at the end of its 1-hour life (guards re-verify the
  // JWT themselves, so nothing here is an authz decision). Its getClaims
  // call costs a JWKS download per request because the client instance is
  // per-request. When the cookie's token still has comfortably more than
  // REFRESH_WINDOW_MS to live, there is nothing to refresh and no cookie
  // to write — skip the call. Any decode failure falls through to the
  // full refresh path, so a malformed or re-keyed cookie behaves exactly
  // as before.
  const freshMs = accessTokenFreshMs(request);
  if (freshMs !== null && freshMs > REFRESH_WINDOW_MS) return NextResponse.next();
  return await updateSession(request);
}


/** Refresh via updateSession once the access token is inside its last two minutes. */
const REFRESH_WINDOW_MS = 120_000;

/** atob-based base64url decode — the proxy runs on the Edge runtime, where Buffer does not exist. */
function base64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Milliseconds until the session cookie's access token expires, or null
 * when it can't be decoded locally (chunked/legacy/malformed) — callers
 * must treat null as "run the full refresh path". This only READS the
 * token's exp; signature verification stays with getClaims in the guards.
 */
function accessTokenExpiresAt(request: NextRequest): number | null {
  // Supabase SSR stores the session under sb-<ref>-auth-token, split into
  // .0/.1/… chunks when it outgrows one cookie.
  const chunks = request.cookies
    .getAll()
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

function accessTokenFreshMs(request: NextRequest): number | null {
  const expMs = accessTokenExpiresAt(request);
  return expMs === null ? null : expMs - Date.now();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/inspect, api/upload-token (unauthenticated document pipeline —
     *   no session cookie to refresh, and this runs on every upload)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/inspect|api/upload-token|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
