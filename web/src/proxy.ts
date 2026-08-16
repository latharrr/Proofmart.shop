import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
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
