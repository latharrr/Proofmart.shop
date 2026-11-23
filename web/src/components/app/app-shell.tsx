import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/components/brand/wordmark";
import RollPill from "@/components/motion/roll-pill";
import { createClient, getVerifiedClaims, isSupabaseConfigured } from "@/lib/supabase/server";
import { SCAN_URL } from "@/components/evidence-rail/scan-intent";
import AccountMenu from "./account-menu";
import AppMobileMenu from "./mobile-menu";
import { signOutAction } from "./actions";

/**
 * The signed-in workspace frame: the sidebar (or, on a phone, a bar) beside
 * a <main id="main"> that the root layout's skip link targets.
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
 *
 * Desktop: a sticky left sidebar (wordmark, mono-indexed sections, the
 * "Verify a document" pill and the account menu at its foot). Below 960px
 * a thin top bar replaces it and the sections fold into one Menu sheet.
 */

export type AppSection = "documents" | "api-keys" | "webhooks" | "billing";

export const APP_NAV: { id: AppSection; href: string; label: string; short?: string }[] = [
  { id: "documents", href: "/documents", label: "My documents", short: "Documents" },
  { id: "api-keys", href: "/account/api-keys", label: "API keys" },
  { id: "webhooks", href: "/account/webhooks", label: "Webhooks" },
  { id: "billing", href: "/account/billing", label: "Billing" },
];

/** Where "Verify a document" goes: the upload rail on the home page — the one place a document can be submitted from the browser — with its drop zone already open and "Choose a PDF" focused. */
export const VERIFY_HREF = SCAN_URL;

async function sessionEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getVerifiedClaims(await createClient());
  return typeof data?.claims?.email === "string" ? data.claims.email : null;
}

export default async function AppShell({ active, email, children }: { active?: AppSection; email?: string | null; children: ReactNode }) {
  const address = email === undefined ? await sessionEmail() : email;

  const signOut = (
    <form action={signOutAction}>
      <RollPill type="submit" variant="secondary" size="sm" block className="pm-app-signout">
        Sign out
      </RollPill>
    </form>
  );

  const verify = (
    <RollPill href={VERIFY_HREF} dot className="pm-app-verify" aria-label="Verify a document">
      Verify<span className="pm-app-verify-long"> a document</span>
    </RollPill>
  );

  return (
    <div className="pm-app">
      {/* Desktop: a left sidebar of mono-indexed sections. */}
      <aside className="pm-app-side">
        <div className="pm-app-brand">
          <Wordmark href="/documents" />
        </div>
        <nav className="pm-app-nav" aria-label="Workspace">
          <ol>
            {APP_NAV.map((item, i) => (
              <li key={item.id}>
                <Link href={item.href} aria-current={item.id === active ? "page" : undefined}>
                  <span className="pm-app-nav-n">{String(i + 1).padStart(2, "0")}</span>
                  {item.short ?? item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className="pm-app-side-foot">
          {verify}
          <AccountMenu email={address} signOut={signOut} />
        </div>
      </aside>

      {/* Below 960px: a thin bar with the same sections in one Menu sheet. */}
      <header className="pm-app-bar">
        <div className="pm-app-bar-inner">
          <Wordmark href="/documents" />
          <div className="pm-app-actions">
            {verify}
            <AppMobileMenu nav={APP_NAV.map(({ id, href, label }) => ({ id, href, label }))} active={active} email={address} signOut={signOut} />
          </div>
        </div>
      </header>

      <main id="main" className="pm-app-main">
        {children}
      </main>
    </div>
  );
}

/** The content column every workspace page sits in: the page width, the gutter, and the top/bottom rhythm. */
export function AppPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `pm-app-page ${className}` : "pm-app-page"}>{children}</div>;
}

/**
 * A workspace page's title block, ruled like the head of a working paper: a
 * back link above, the title, and its `meta` (counts, the verdict) on the
 * line beneath it. `size="md"` is for long titles such as a filename. The
 * description and actions sit in the right column on desktop and under the
 * title on a phone.
 */
export function AppPageHeader({
  title,
  description,
  actions,
  back,
  meta,
  size = "lg",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
  /** "lg" (default) = heading-lg; "md" = heading, for long titles. */
  size?: "lg" | "md";
}) {
  return (
    <div className="pm-app-head" data-size={size}>
      {back && (
        <Link href={back.href} className="pm-app-back">
          <BackArrow />
          {back.label}
        </Link>
      )}
      <div className="pm-app-head-row">
        <div className="pm-app-head-text">
          <h1 className="pm-app-title">{title}</h1>
          {meta && <div className="pm-app-head-meta">{meta}</div>}
        </div>
        {(description || actions) && (
          <div className="pm-app-head-side">
            {description && <p className="pm-app-desc">{description}</p>}
            {actions && <div className="pm-app-head-actions">{actions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The header's shape while a page streams in (for loading.tsx): the same
 * boxes as <AppPageHeader>, filled with skeleton bars, so the real title can
 * rise into exactly that space without a jump — and rises once, not twice.
 */
export function AppPageHeaderSkeleton({ back, size = "lg", label = "Loading" }: { back?: string; size?: "lg" | "md"; label?: string }) {
  return (
    <div className="pm-app-head pm-skeleton" data-size={size} role="status" aria-label={label}>
      {back && (
        <span className="pm-app-back" aria-hidden="true">
          <BackArrow />
          {back}
        </span>
      )}
      <div className="pm-app-head-row" aria-hidden="true">
        <div className="pm-app-head-text">
          <span className="pm-app-title">
            <span className="pm-skeleton-bar pm-skeleton-title" />
          </span>
          <div className="pm-app-head-meta">
            <span className="pm-skeleton-bar pm-skeleton-label" />
          </div>
        </div>
        <div className="pm-app-head-side">
          <span className="pm-skeleton-bar pm-skeleton-line" />
          <span className="pm-skeleton-bar pm-skeleton-line" style={{ width: "62%" }} />
        </div>
      </div>
    </div>
  );
}

function BackArrow() {
  return (
    <svg className="pm-app-back-arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M12 7.2H2.8M6.4 3.4 2.6 7.2 6.4 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}
