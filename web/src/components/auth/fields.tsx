"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import RollPill from "@/components/motion/roll-pill";

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
    /* storage blocked: nothing to remember, nothing breaks */
  }
}

/** Label row: the label, and optionally one small control on the right (e.g. "Forgot password?"). */
function LabelRow({ htmlFor, label, aside }: { htmlFor: string; label: string; aside?: ReactNode }) {
  return (
    <div className="pm-auth-label-row">
      <label htmlFor={htmlFor} className="pm-auth-label">
        {label}
      </label>
      {aside}
    </div>
  );
}

export function EmailField({
  label = "Email",
  invalid,
  describedBy,
  restore,
  autoFocus,
  error,
  id = "email",
}: {
  label?: string;
  invalid?: boolean;
  describedBy?: string;
  /** After a failed attempt the action redirects with an empty form; put back what was typed. */
  restore?: boolean;
  autoFocus?: boolean;
  /** A message about this field, shown directly under it. */
  error?: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!restore || !ref.current || ref.current.value) return;
    const saved = readEmail();
    if (saved) ref.current.value = saved;
  }, [restore]);

  return (
    <div className="pm-auth-field">
      <LabelRow htmlFor={id} label={label} />
      <input
        ref={ref}
        id={id}
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
      {error}
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
  aside,
  error,
}: {
  label?: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  /** Persistent guidance under the field, e.g. the length rule. */
  hint?: string;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  /** Shown at the right of the label row, e.g. the forgot-password link. */
  aside?: ReactNode;
  /** A message about this field, shown directly under it. */
  error?: ReactNode;
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
      <LabelRow htmlFor="password" label={label} aside={aside} />
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
          <EyeIcon open={!visible} />
          <span aria-hidden="true">{visible ? "Hide" : "Show"}</span>
        </button>
      </div>
      {error}
      {(hint || capsLock) && (
        <p className="pm-auth-under">
          {hint && (
            <span id={hintId} className="pm-auth-hint">
              {hint}
            </span>
          )}
          {capsLock && (
            <span id={capsId} className="pm-auth-caps" role="status">
              Caps Lock is on
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {!open && <path d="M2.5 13.5 13.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}

/**
 * Submit pill for a server-action form. While the action runs (including the
 * redirect it ends in) the pill is disabled and says what is happening, so a
 * slow network never invites a second click.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  icon,
  dot = true,
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "paper";
  icon?: ReactNode;
  dot?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <RollPill
      type="submit"
      variant={variant}
      icon={icon}
      dot={dot}
      block
      pending={pending}
      pendingLabel={pendingLabel}
      className="pm-auth-submit"
    >
      {children}
    </RollPill>
  );
}

/**
 * "Send a new confirmation email", placed inside another form (the sign-in
 * form) so it can reuse the address already typed there. It is a plain
 * button, not a second submit, so pressing Enter still signs in.
 */
export function ResendButton({
  action,
  emailFrom = "email",
}: {
  action: (formData: FormData) => Promise<void>;
  /** id of the email input to read. */
  emailFrom?: string;
}) {
  const [pending, start] = useTransition();
  const [missing, setMissing] = useState(false);
  return (
    <span className="pm-auth-resend">
      <RollPill
        variant="paper"
        size="sm"
        dot
        pending={pending}
        pendingLabel="Sending"
        onClick={() => {
          const input = document.getElementById(emailFrom) as HTMLInputElement | null;
          const email = input?.value.trim() ?? "";
          if (!email || (input && !input.checkValidity())) {
            setMissing(true);
            input?.focus();
            return;
          }
          setMissing(false);
          const fd = new FormData();
          fd.set("email", email);
          start(() => action(fd));
        }}
      >
        Resend confirmation
      </RollPill>
      {missing && (
        <span className="pm-auth-hint" role="status">
          Type your email above first.
        </span>
      )}
    </span>
  );
}
