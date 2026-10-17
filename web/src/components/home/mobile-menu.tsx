"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { SECTION_LINKS, useActiveSection } from "@/components/home/nav-links";
import OpenScanButton from "@/components/home/open-scan-button";

/**
 * Narrow-screen navigation (below 1100px the inline nav is hidden). A Menu
 * button opens a sheet under the header with every section, /security, a
 * Start-a-scan pill and the server-rendered account block (`account`).
 * Escape or following a link closes it.
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
    document.documentElement.dataset.menuOpen = "";
    return () => {
      window.removeEventListener("keydown", onKey);
      delete document.documentElement.dataset.menuOpen;
    };
  }, [open]);

  return (
    <div className="pm-mk-menu">
      <button type="button" className="pm-pill pm-mk-menu-btn" data-variant="secondary" data-size="sm" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="pm-pill-roll">{open ? "Close" : "Menu"}</span>
      </button>
      <div id={panelId} className="pm-mk-menu-panel" hidden={!open}>
        <nav aria-label="Primary, mobile" className="pm-wrap pm-mk-menu-inner">
          <ul className="pm-mk-menu-links">
            {SECTION_LINKS.map((l) => (
              <li key={l.id}>
                <a href={`/#${l.id}`} data-active={active === l.id ? "true" : "false"} onClick={() => setOpen(false)}>
                  <span className="pm-mk-menu-n">{l.wp}</span>
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/security" data-active={pathname === "/security" ? "true" : "false"} onClick={() => setOpen(false)}>
                <span className="pm-mk-menu-n" aria-hidden="true" />
                Security
              </Link>
            </li>
          </ul>
          <div className="pm-mk-menu-foot">
            <OpenScanButton variant="primary" onDone={() => setOpen(false)} className="pm-mk-menu-scan">
              Start a scan
            </OpenScanButton>
            {account}
          </div>
        </nav>
      </div>
    </div>
  );
}
