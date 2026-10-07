import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/components/brand/wordmark";
import LineReveal from "@/components/motion/line-reveal";
import RollPill from "@/components/motion/roll-pill";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SCAN_URL } from "@/components/evidence-rail/scan-intent";
import AccountMenu from "./account-menu";
import AppMobileMenu from "./mobile-menu";
import RollLabel from "./roll-label";
import { signOutAction } from "./actions";

/**
 * The signed-in workspace frame: a sticky app bar (wordmark, section nav,
 * the "Verify a document" primary pill, account menu) over a <main id="main">
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
 *
 * Desktop: the nav is a haze pill track centred in the bar, the current
 * section a paper pill with the volt dot. Below 960px the nav and the account
 * menu fold into one MENU sheet.
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
  const { data } = await (await createClient()).auth.getClaims();
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

  return (
    <div className="pm-app">
      <header className="pm-app-bar">
        <div className="pm-app-bar-inner">
          <div className="pm-app-brand">
            <Wordmark href="/documents" size={26} fontSize={22} />
          </div>

          <nav className="pm-app-nav" aria-label="Workspace">
            <ul>
              {APP_NAV.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} aria-current={item.id === active ? "page" : undefined}>
                    <span className="pm-app-nav-dot" aria-hidden="true" />
                    <RollLabel>{item.label}</RollLabel>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pm-app-actions">
            <RollPill href={VERIFY_HREF} dot className="pm-app-verify" aria-label="Verify a document">
              Verify<span className="pm-app-verify-long"> a document</span>
            </RollPill>
            <AccountMenu email={address} signOut={signOut} />
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

/** The content column every workspace page sits in — the 1296px grid, the page gutter, and the top/bottom rhythm. */
export function AppPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `pm-app-page ${className}` : "pm-app-page"}>{children}</div>;
}

/**
 * A workspace page's title block: an optional label (`meta`) and back link
 * above the title, which rises line by line from its mask (heading-lg, 88px
 * desktop / 44px mobile; `size="md"` drops to the 48px heading role for long
 * titles such as a filename). The description and actions sit in the right
 * column on desktop and under the title on a phone.
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
          <span className="pm-app-back-arrow" aria-hidden="true">
            ←
          </span>
          {back.label}
        </Link>
      )}
      <div className="pm-app-head-row">
        <div className="pm-app-head-text">
          {meta && <div className="pm-app-head-meta">{meta}</div>}
          <LineReveal as="h1" className="pm-app-title">
            {title}
          </LineReveal>
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
          <span className="pm-app-back-arrow">←</span>
          {back}
        </span>
      )}
      <div className="pm-app-head-row" aria-hidden="true">
        <div className="pm-app-head-text">
          <div className="pm-app-head-meta">
            <span className="pm-skeleton-bar pm-skeleton-label" />
          </div>
          <span className="pm-app-title">
            <span className="pm-skeleton-bar pm-skeleton-title" />
          </span>
        </div>
        <div className="pm-app-head-side">
          <span className="pm-skeleton-bar pm-skeleton-line" />
          <span className="pm-skeleton-bar pm-skeleton-line" style={{ width: "62%" }} />
        </div>
      </div>
    </div>
  );
}
