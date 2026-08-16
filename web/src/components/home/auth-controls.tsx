import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";

// Server component: reads the session on the server (getClaims — verifies
// the JWT locally/against Supabase's JWKS, not the unrevalidated
// getSession) and renders either a "Sign in" link or the signed-in user's
// email with a "Sign out" button (a zero-JS server-action form).
//
// This renders on every page via Topbar, so a missing Supabase config
// (env vars not yet set, e.g. on a fresh Vercel deploy) must degrade to
// the signed-out state, not crash every page on the site — createClient()
// itself would throw synchronously if it ran.
export default async function AuthControls() {
  const claims = isSupabaseConfigured() ? (await (await createClient()).auth.getClaims()).data?.claims : null;

  if (!claims) {
    return (
      <Link
        href="/login"
        className="pm-hoverable"
        style={{ fontFamily: SANS, fontSize: 14, color: "#43494F" }}
      >
        Sign in
      </Link>
    );
  }

  const email = typeof claims.email === "string" ? claims.email : "Account";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "#43494F",
          maxWidth: 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {email}
      </span>
      <Link
        href="/account/api-keys"
        className="pm-hoverable"
        style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.04em" }}
      >
        API keys
      </Link>
      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          revalidatePath("/", "layout");
          redirect("/");
        }}
      >
        <button
          type="submit"
          className="pm-hoverable"
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: "#767C83",
            background: "none",
            border: "1px solid #DDE1E4",
            borderRadius: 3,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
