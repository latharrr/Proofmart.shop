"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { SECTION_LINKS, useActiveSection } from "@/components/home/nav-links";
import OpenScanButton from "@/components/home/open-scan-button";

/**
 * Narrow-screen navigation (below 1180px the inline nav is hidden). A MENU
 * pill opens a sheet under the header with every section, /security, a
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
        <span className="pm-pill-roll">
          <span>{open ? "Close" : "Menu"}</span>
          <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
        </span>
        <span className="pm-mk-menu-dots" aria-hidden="true" data-open={open ? "" : undefined}>
          <span />
          <span />
        </span>
      </button>
      <div id={panelId} className="pm-mk-menu-panel" hidden={!open}>
        <nav aria-label="Primary, mobile" className="pm-wrap pm-mk-menu-inner">
          <ul className="pm-mk-menu-links">
            {SECTION_LINKS.map((l, i) => (
              <li key={l.id} style={{ ["--i" as string]: i }}>
                <a href={`/#${l.id}`} data-active={active === l.id ? "true" : "false"} onClick={() => setOpen(false)}>
                  <span className="pm-mk-menu-n">{String(i + 1).padStart(2, "0")}</span>
                  {l.label}
                </a>
              </li>
            ))}
            <li style={{ ["--i" as string]: SECTION_LINKS.length }}>
              <Link href="/security" data-active={pathname === "/security" ? "true" : "false"} onClick={() => setOpen(false)}>
                <span className="pm-mk-menu-n">{String(SECTION_LINKS.length + 1).padStart(2, "0")}</span>
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
