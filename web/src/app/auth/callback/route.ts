import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";

/**
 * PKCE code-exchange endpoint, shared by every auth flow that mails or
 * redirects a `?code=` link: Google OAuth (signInWithOAuth), signup email
 * confirmation, and password-reset emails (which set `next=/account/
 * update-password`). One route because they're the same exchange —
 * exchangeCodeForSession(code) — differing only in where they land after.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) next = "/";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await recordAuditEvent({ userId: data.user.id, eventType: "sign_in", metadata: { method: "oauth_or_email_link" } });
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
