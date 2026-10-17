"use client";

import { Arrow } from "@/components/paper/tickmark";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Account links shared by the desktop menu and the mobile sheet. */
export const ACCOUNT_LINKS = [
  { href: "/account/update-password", label: "Change password" },
  { href: "/security", label: "Security & privacy" },
  { href: "/", label: "ProofMart home" },
] as const;

/**
 * Closes a disclosure on Escape (returning focus to its trigger) and on a
 * pointer-down outside `root`. Shared by the account menu and the mobile sheet.
 */
export function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLElement | null>, trigger: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close, root, trigger]);
}

/**
 * The account control at the right of the app bar (desktop): a 48px icon pill
 * carrying the address's initial, opening a floating menu with the signed-in
 * address, account links and sign-out. `signOut` is the server-rendered
 * sign-out form, passed in so the server action stays on the server.
 *
 * Closes on Escape (returning focus to the trigger), on an outside click, and
 * when focus leaves the menu.
 */
export default function AccountMenu({ email, signOut }: { email: string | null; signOut: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const initial = (email?.trim()[0] ?? "").toUpperCase();
  const close = useRef(() => setOpen(false)).current;

  useDismiss(open, close, rootRef, triggerRef);

  return (
    <div
      ref={rootRef}
      className="pm-app-account"
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="pm-app-account-trigger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={email ? `Account: ${email}` : "Account"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pm-pill-roll" aria-hidden="true">
          <span>{initial || <span className="pm-app-avatar-blank" />}</span>
          <span>{initial || <span className="pm-app-avatar-blank" />}</span>
        </span>
      </button>

      <div id={menuId} className="pm-app-menu" data-open={open || undefined} inert={!open}>
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
  );
}
