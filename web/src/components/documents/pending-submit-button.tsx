"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import RollPill from "@/components/motion/roll-pill";

/**
 * A submit pill that reports its form's server action while it runs. Re-run
 * re-executes the whole verification pipeline and takes several seconds; a
 * button that looks idle for that long gets pressed again. While pending the
 * pill is disabled, `aria-busy`, shows `pendingLabel` and pulses its dot.
 */
export default function PendingSubmitButton({
  children,
  pendingLabel,
  variant = "secondary",
  size = "sm",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
  children: ReactNode;
  pendingLabel: ReactNode;
  variant?: "primary" | "secondary" | "paper";
  size?: "md" | "sm";
}) {
  const { pending } = useFormStatus();
  return (
    <RollPill type="submit" variant={variant} size={size} {...props} pending={pending} pendingLabel={pendingLabel} data-pending={pending || undefined}>
      {children}
    </RollPill>
  );
}
