"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAction } from "@/components/app/actions";
import RollPill from "@/components/motion/roll-pill";
import TopAccount from "@/components/home/top-account";
import OpenScanButton from "@/components/home/open-scan-button";

/**
 * The header's auth-aware parts, rendered on the client so the marketing
 * pages stay static and CDN-cacheable: the server HTML is the signed-out
 * state for everyone (no cookies read, nothing personalized in the shared
 * cache), and after hydration the browser Supabase client swaps in the
 * signed-in controls when a session exists. The browser client also keeps
 * the session refreshed on public pages, so dropping the server-side read
 * does not log anyone out.
 *
 * layout="bar"  — desktop: .pm-mk-top-auth (Sign in, or the ACCOUNT pill
 *                 panel) plus the header CTA (Get access vs New scan).
 * layout="menu" — the same controls stacked for the phone menu sheet.
 *
 * The initial render is always the signed-out markup, matching the server
 * HTML exactly; the signed-in swap happens one effect after hydration.
 */
const ACCOUNT_LINKS = [
  { href: "/documents", label: "Documents" },
  { href: "/account/api-keys", label: "API keys" },
  { href: "/account/webhooks", label: "Webhooks" },
  { href: "/account/billing", label: "Billing" },
];

export default function HeaderAuth({ layout = "bar" }: { layout?: "bar" | "menu" }) {
  const [email, setEmail] = useState<string | null>(null);
  const menu = layout === "menu";

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const apply = (session: Session | null) => {
      const e = session?.user?.email;
      setEmail(typeof e === "string" && e.length > 0 ? e : null);
      if (!menu) {
        document
          .querySelector(".pm-mk-top")
          ?.toggleAttribute("data-signed-in", Boolean(session));
      }
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => subscription.unsubscribe();
  }, [menu]);

  const signedIn = email !== null;

  if (menu) {
    if (!signedIn) {
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
      <div className="pm-mk-menu-account">
        <span className="pm-mk-account-email">{email}</span>
        <ul className="pm-mk-account-links">
          {ACCOUNT_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="pm-mk-account-link">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOutAction}>
          <RollPill type="submit" variant="secondary" size="sm" block>
            Sign out
          </RollPill>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="pm-mk-top-auth">
        {signedIn ? (
          <TopAccount email={email}>
            <span className="pm-mk-account-email">{email}</span>
            <ul className="pm-mk-account-links">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="pm-mk-account-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <form action={signOutAction}>
              <RollPill type="submit" variant="secondary" size="sm">
                Sign out
              </RollPill>
            </form>
          </TopAccount>
        ) : (
          <RollPill href="/login" variant="secondary" size="sm" className="pm-mk-top-signin">
            Sign in
          </RollPill>
        )}
      </div>
      {/* Signed out, the header CTA grants access; signed in, the account
          is already there, so it becomes the next useful action. */}
      {signedIn ? (
        <OpenScanButton size="sm" className="pm-mk-top-cta">
          New scan
        </OpenScanButton>
      ) : (
        <RollPill href="/signup" size="sm" dot className="pm-mk-top-cta">
          Get access
        </RollPill>
      )}
    </>
  );
}
