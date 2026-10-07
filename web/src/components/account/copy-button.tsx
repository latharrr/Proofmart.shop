"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import PillLabel from "./pill-label";

/**
 * Copies `value` to the clipboard and confirms in place ("Copied") for a
 * moment. If the clipboard is unavailable (an insecure origin, a denied
 * permission) it says so instead of pretending, so the person knows to
 * select the text by hand. The confirmation is announced politely.
 *
 * Renders a rolling-label pill (foundation `.pm-pill`).
 */
export default function CopyButton({
  value,
  children = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  size = "sm",
  dot,
  className,
  ariaLabel,
  onCopied,
}: {
  value: string;
  children?: ReactNode;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "paper";
  size?: "md" | "sm";
  dot?: boolean;
  className?: string;
  ariaLabel?: string;
  onCopied?: () => void;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      onCopied?.();
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  }

  return (
    <>
      <button
        type="button"
        className={className ? `pm-pill pm-acct-copy ${className}` : "pm-pill pm-acct-copy"}
        data-variant={variant}
        data-size={size}
        onClick={copy}
        aria-label={ariaLabel}
        data-copied={state === "copied" ? "" : undefined}
      >
        <PillLabel dot={dot}>{state === "idle" ? children : state === "copied" ? copiedLabel : "Copy blocked"}</PillLabel>
      </button>
      <span className="pm-acct-sr" aria-live="polite">
        {state === "copied" ? "Copied to clipboard." : state === "failed" ? "Couldn't reach the clipboard. Select the text and copy it by hand." : ""}
      </span>
    </>
  );
}
