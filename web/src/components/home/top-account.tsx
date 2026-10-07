"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import RollPill from "@/components/motion/roll-pill";

/**
 * Signed-in account control for the marketing header: one ACCOUNT pill that
 * opens a floating panel with the email, the account links and sign out.
 * The contents are server-rendered (auth-controls.tsx) and passed through.
 * Closes on Escape, on an outside click, and when a link inside is followed.
 */
export default function TopAccount({ email, children }: { email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="pm-mk-account" ref={wrap} data-open={open ? "" : undefined}>
      <RollPill
        variant="secondary"
        size="sm"
        dot
        aria-expanded={open}
        aria-controls={id}
        title={email}
        onClick={() => setOpen((v) => !v)}
      >
        Account
      </RollPill>
      <div
        id={id}
        className="pm-mk-account-panel"
        hidden={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {children}
      </div>
    </div>
  );
}
