"use client";

import { Arrow } from "@/components/paper/tickmark";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ACCOUNT_LINKS, useDismiss } from "./account-menu";

type NavItem = { id: string; href: string; label: string };

/**
 * The app bar's MENU control below 960px: a 40px icon pill that opens a sheet
 * holding the workspace sections (the current one marked with the volt dot),
 * the signed-in address, the account links and sign-out. Hidden on desktop,
 * where the nav track and <AccountMenu> carry the same things.
 */
export default function AppMobileMenu({ nav, active, email, signOut }: { nav: NavItem[]; active?: string; email: string | null; signOut: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();
  const close = useCallback(() => setOpen(false), []);

  useDismiss(open, close, rootRef, triggerRef);

  // A sheet left open while the window widens past the breakpoint would
  // otherwise reappear the next time it narrows.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 961px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <div ref={rootRef} className="pm-app-mnav">
      <button
        ref={triggerRef}
        type="button"
        className="pm-app-mnav-trigger"
        aria-expanded={open}
        aria-controls={sheetId}
        aria-label={open ? "Close menu" : "Menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pm-app-mnav-dots" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      <div id={sheetId} className="pm-app-sheet" data-open={open || undefined} inert={!open}>
        <nav aria-label="Workspace">
          <ul className="pm-app-sheet-nav">
            {nav.map((item) => (
              <li key={item.id}>
                <Link href={item.href} aria-current={item.id === active ? "page" : undefined} onClick={() => setOpen(false)}>
                  <span className="pm-app-nav-dot" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="pm-app-sheet-account">
          <div className="pm-app-menu-who">
            <span className="pm-app-menu-label">Signed in as</span>
            <span className="pm-app-menu-email">{email ?? "your account"}</span>
          </div>
          <ul className="pm-app-menu-links">
            {ACCOUNT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                  <Arrow className="pm-app-menu-arrow" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="pm-app-menu-foot">{signOut}</div>
        </div>
      </div>
    </div>
  );
}
