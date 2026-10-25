import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { shouldSkipSessionRefresh } from "@/lib/supabase/session-cookie";
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
  if (shouldSkipSessionRefresh(request.cookies.getAll(), Date.now(), REFRESH_WINDOW_MS)) {
    return NextResponse.next();
  }
  return await updateSession(request);
}


/** Refresh via updateSession once the access token is inside its last two minutes. */
const REFRESH_WINDOW_MS = 120_000;

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
