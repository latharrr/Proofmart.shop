import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
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
