"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * The account control at the right of the app bar: an initial disc (plus the
 * address, where there is room) that opens a small menu with the signed-in
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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
        <span className="pm-app-avatar" aria-hidden="true">
          {initial || <span className="pm-app-avatar-blank" />}
        </span>
        {email && (
          <span className="pm-app-account-email" aria-hidden="true">
            {email}
          </span>
        )}
        <svg className="pm-app-account-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={menuId} className="pm-app-menu" hidden={!open}>
        <div className="pm-app-menu-who">
          <span className="pm-caption" style={{ color: "var(--pm-ash)" }}>
            Signed in as
          </span>
          <span className="pm-app-menu-email">{email ?? "your account"}</span>
        </div>
        <ul className="pm-app-menu-links">
          <li>
            <Link href="/account/update-password" onClick={() => setOpen(false)}>
              Change password
            </Link>
          </li>
          <li>
            <Link href="/security" onClick={() => setOpen(false)}>
              Security &amp; privacy
            </Link>
          </li>
          <li>
            <Link href="/" onClick={() => setOpen(false)}>
              ProofMart home
            </Link>
          </li>
        </ul>
        <div className="pm-app-menu-foot">{signOut}</div>
      </div>
    </div>
  );
}
