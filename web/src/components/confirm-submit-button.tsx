"use client";

import type { ButtonHTMLAttributes } from "react";

/** A `type="submit"` button that blocks its enclosing form's server action behind a native `confirm()` — for irreversible actions (revoke, delete) where a single misclick has real consequences. */
export default function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}
