"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Client-side pieces of the auth forms. The forms themselves stay server
// components posting to the existing server actions; these add only what a
// browser can do better: show the password, warn about Caps Lock, keep the
// email you typed after a failed attempt, and say the request is in flight.

const EMAIL_KEY = "pm-auth-email";

function readEmail(): string {
  try {
    return window.sessionStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeEmail(value: string) {
  try {
    window.sessionStorage.setItem(EMAIL_KEY, value);
  } catch {
    /* storage blocked — nothing to remember, nothing breaks */
  }
}

export function EmailField({
  label = "Email",
  invalid,
  describedBy,
  restore,
  autoFocus,
}: {
  label?: string;
  invalid?: boolean;
  describedBy?: string;
  /** After a failed attempt the action redirects with an empty form; put back what was typed. */
  restore?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!restore || !ref.current || ref.current.value) return;
    const saved = readEmail();
    if (saved) ref.current.value = saved;
  }, [restore]);

  return (
    <div className="pm-auth-field">
      <label htmlFor="email" className="pm-auth-label">
        {label}
      </label>
      <input
        ref={ref}
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="you@company.com"
        required
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => writeEmail(e.currentTarget.value)}
        className="pm-auth-input"
      />
    </div>
  );
}

export function PasswordField({
  label = "Password",
  autoComplete,
  minLength,
  hint,
  invalid,
  describedBy,
  autoFocus,
  after,
}: {
  label?: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  /** Persistent guidance under the field, e.g. the length rule. */
  hint?: string;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  /** Rendered under the field, after the hint — e.g. the forgot-password link. */
  after?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const hintId = useId();
  const capsId = useId();
  const described = [describedBy, hint ? hintId : null, capsLock ? capsId : null].filter(Boolean).join(" ") || undefined;

  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") setCapsLock(e.getModifierState("CapsLock"));
  };

  return (
    <div className="pm-auth-field">
      <label htmlFor="password" className="pm-auth-label">
        {label}
      </label>
      <div className="pm-auth-password">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={minLength}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          aria-describedby={described}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={() => setCapsLock(false)}
          className="pm-auth-input"
        />
        <button
          type="button"
          className="pm-auth-reveal"
          aria-controls="password"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {(hint || capsLock || after) && (
        <div className="pm-auth-under">
          <span>
            {hint && (
              <span id={hintId} className="pm-auth-hint">
                {hint}
              </span>
            )}
            {capsLock && (
              <span id={capsId} className="pm-auth-hint pm-auth-hint-strong" role="status">
                {hint ? " · " : ""}Caps Lock is on
              </span>
            )}
          </span>
          {after}
        </div>
      )}
    </div>
  );
}

/**
 * Submit button for a server-action form. While the action runs (including
 * the redirect it ends in) the button is disabled and says what is happening,
 * so a slow network never invites a second click.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "filled",
  icon,
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: "filled" | "ghost";
  icon?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending || undefined}
      data-pending={pending || undefined}
      className={`pm-btn ${variant === "filled" ? "pm-btn-filled" : "pm-btn-ghost"} pm-auth-btn`}
    >
      {icon}
      <span aria-live="polite">{pending ? pendingLabel : children}</span>
    </button>
  );
}
