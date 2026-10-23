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
  return await updateSession(request);
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
