import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";
import RollPill from "@/components/motion/roll-pill";
import TopAccount from "@/components/home/top-account";

// Server component: reads the session on the server (getClaims — verifies
// the JWT, not the unrevalidated getSession) and renders the signed-out
// pills or the signed-in account controls. Sign out is a zero-JS
// server-action form.
//
// Renders on every marketing page via Topbar, so a missing Supabase config
// must degrade to the signed-out state, not crash the page.
//
// layout="bar"  — desktop header: Sign in, or an ACCOUNT pill that opens a
//                 panel (email, account links, sign out). One pill, so the
//                 signed-in header never wraps.
// layout="menu" — the same controls stacked for the phone menu sheet.
const ACCOUNT_LINKS = [
  { href: "/documents", label: "Documents" },
  { href: "/account/api-keys", label: "API keys" },
  { href: "/account/webhooks", label: "Webhooks" },
  { href: "/account/billing", label: "Billing" },
];

export async function getSessionClaims() {
  return isSupabaseConfigured() ? ((await (await createClient()).auth.getClaims()).data?.claims ?? null) : null;
}

export default async function AuthControls({ layout = "bar" }: { layout?: "bar" | "menu" }) {
  const claims = await getSessionClaims();
  const menu = layout === "menu";

  if (!claims) {
    if (menu) {
      return (
        <div className="pm-mk-menu-account">
          <RollPill href="/signup" dot block>
            Get access
          </RollPill>
          <RollPill href="/login" variant="secondary" block>
            Sign in
          </RollPill>
        </div>
      );
    }
    return (
      <RollPill href="/login" variant="secondary" size="sm" className="pm-mk-top-signin">
        Sign in
      </RollPill>
    );
  }

  const email = typeof claims.email === "string" ? claims.email : "Account";
  const userId = typeof claims.sub === "string" ? claims.sub : null;

  const signOut = (
    <form
      action={async () => {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        await recordAuditEvent({ userId, eventType: "sign_out" });
        revalidatePath("/", "layout");
        redirect("/");
      }}
    >
      <RollPill type="submit" variant="secondary" size="sm" block={menu}>
        Sign out
      </RollPill>
    </form>
  );

  const links = (
    <ul className="pm-mk-account-links">
      {ACCOUNT_LINKS.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="pm-mk-account-link">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  if (menu) {
    return (
      <div className="pm-mk-menu-account">
        <span className="pm-mk-account-email">{email}</span>
        {links}
        {signOut}
      </div>
    );
  }

  return (
    <TopAccount email={email}>
      <span className="pm-mk-account-email">{email}</span>
      {links}
      {signOut}
    </TopAccount>
  );
}
