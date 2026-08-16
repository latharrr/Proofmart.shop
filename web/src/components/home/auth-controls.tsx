import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";

// Server component: reads the session on the server (getClaims — verifies
// the JWT locally/against Supabase's JWKS, not the unrevalidated
// getSession) and renders either a "Sign in" link or the signed-in user's
// email with a "Sign out" button (a zero-JS server-action form).
export default async function AuthControls() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

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
