"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { SECTION_LINKS, useActiveSection } from "@/components/home/nav-links";

/**
 * Phone-width navigation. Below 880px the inline nav is hidden, and before
 * this existed a phone visitor had no way to reach a section — or /security —
 * except by scrolling the whole page. A plain disclosure: a pill button
 * toggles a sheet under the header. It appears without animation; the site
 * has exactly one enter gesture and it belongs to scroll reveals.
 *
 * `account` is the server-rendered auth block (sign in, or the signed-in
 * account links and sign out), passed through so the session is still read
 * on the server.
 */
export default function MobileMenu({ account }: { account: ReactNode }) {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="pm-mobile-menu">
      <button
        type="button"
        className="pm-btn pm-btn-ghost pm-btn-sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <div id={panelId} className="pm-mobile-panel" hidden={!open}>
        <nav aria-label="Primary, mobile" className="pm-shell">
          <ul>
            {SECTION_LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`/#${l.id}`}
                  className="pm-nav-link"
                  data-active={active === l.id ? "true" : "false"}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/security"
                className="pm-nav-link"
                data-active={pathname === "/security" ? "true" : "false"}
                onClick={() => setOpen(false)}
              >
                Security
              </Link>
            </li>
          </ul>
          <div className="pm-mobile-account">{account}</div>
        </nav>
      </div>
    </div>
  );
}
