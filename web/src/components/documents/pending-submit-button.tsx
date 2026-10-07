"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * A submit button that reports its form's server action while it runs. Re-run
 * re-executes the whole verification pipeline and takes several seconds; a
 * button that looks idle for that long gets pressed again.
 */
export default function PendingSubmitButton({
  children,
  pendingLabel,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & { children: ReactNode; pendingLabel: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...props} disabled={pending || props.disabled} aria-busy={pending || undefined} data-pending={pending || undefined}>
      {pending ? pendingLabel : children}
    </button>
  );
}
