import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/components/brand/wordmark";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import AccountMenu from "./account-menu";
import { signOutAction } from "./actions";

/**
 * The signed-in workspace frame: a sticky app bar (wordmark, section nav,
 * the "Verify a document" primary action, account menu) over a <main id="main">
 * that the root layout's skip link targets.
 *
 * Usage, from any signed-in page — after the page's own auth redirect:
 *
 *   <AppShell active="api-keys">
 *     <AppPage>
 *       <AppPageHeader title="API keys" description="…" actions={…} />
 *       …
 *     </AppPage>
 *   </AppShell>
 *
 * `email` is optional: omitted, the shell reads it from the session itself;
 * `null` renders the account control without an address (loading skeletons).
 * The shell never redirects — auth gating stays with each page.
 */

export type AppSection = "documents" | "api-keys" | "webhooks" | "billing";

export const APP_NAV: { id: AppSection; href: string; label: string; short?: string }[] = [
  { id: "documents", href: "/documents", label: "My documents", short: "Documents" },
  { id: "api-keys", href: "/account/api-keys", label: "API keys" },
  { id: "webhooks", href: "/account/webhooks", label: "Webhooks" },
  { id: "billing", href: "/account/billing", label: "Billing" },
];

/** Where "Verify a document" goes: the upload rail on the home page — the one place a document can be submitted from the browser. */
export const VERIFY_HREF = "/#access";

async function sessionEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await (await createClient()).auth.getClaims();
  return typeof data?.claims?.email === "string" ? data.claims.email : null;
}

export default async function AppShell({ active, email, children }: { active?: AppSection; email?: string | null; children: ReactNode }) {
  const address = email === undefined ? await sessionEmail() : email;

  return (
    <div className="pm-app">
      <header className="pm-app-bar">
        <div className="pm-app-bar-inner">
          <div className="pm-app-brand">
            <Wordmark href="/documents" />
          </div>

          <nav className="pm-app-nav" aria-label="Workspace">
            <ul>
              {APP_NAV.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} aria-current={item.id === active ? "page" : undefined}>
                    {item.short ? (
                      <>
                        <span className="pm-app-nav-full">{item.label}</span>
                        <span className="pm-app-nav-short">{item.short}</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pm-app-actions">
            <Link href={VERIFY_HREF} className="pm-btn pm-btn-filled pm-btn-sm pm-app-verify" aria-label="Verify a document">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span>
                Verify<span className="pm-app-verify-long"> a document</span>
              </span>
            </Link>
            <AccountMenu
              email={address}
              signOut={
                <form action={signOutAction}>
                  <button type="submit" className="pm-btn pm-btn-ghost pm-btn-sm pm-app-signout">
                    Sign out
                  </button>
                </form>
              }
            />
          </div>
        </div>
      </header>

      <main id="main" className="pm-app-main">
        {children}
      </main>
    </div>
  );
}

/** The content column every workspace page sits in — 1200px max, the page gutter, and the top/bottom rhythm. */
export function AppPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `pm-app-page ${className}` : "pm-app-page"}>{children}</div>;
}

/**
 * A workspace page's title block: the serif page title (heading role, 44px),
 * an optional one-paragraph description, optional actions on the right and an
 * optional back link above.
 */
export function AppPageHeader({
  title,
  description,
  actions,
  back,
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
}) {
  return (
    <div className="pm-app-head">
      {back && (
        <Link href={back.href} className="pm-link pm-app-back">
          <span className="pm-app-back-arrow" aria-hidden="true">
            ←
          </span>
          {back.label}
        </Link>
      )}
      <div className="pm-app-head-row">
        <div className="pm-app-head-text">
          {meta}
          <h1 className="pm-app-title">{title}</h1>
          {description && <p className="pm-app-desc">{description}</p>}
        </div>
        {actions && <div className="pm-app-head-actions">{actions}</div>}
      </div>
    </div>
  );
}
