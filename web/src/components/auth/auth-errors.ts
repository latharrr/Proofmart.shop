// The server actions redirect back with the provider's message in `?error=`.
// That text is accurate but written for developers ("Invalid login
// credentials"), and because it arrives in the URL anyone can put anything
// there. So it is only ever *matched*, never printed: each known message maps
// to what a person needs (what went wrong, which field it belongs to, what to
// do next) and everything else falls back to a fixed generic message.

export type AuthField = "email" | "password" | "google" | "form";

export interface AuthErrorCopy {
  /** One sentence: what went wrong. */
  title: string;
  /** What to do about it. */
  body?: string;
  /** Which control the message sits next to. */
  field: AuthField;
  /** An optional way out, rendered as an inline link. */
  action?: { label: string; href: string };
  /** The sign-in failed because the address was never confirmed: offer a resend. */
  resend?: boolean;
}

/** Long or hostile query strings are never worth scanning in full. */
const norm = (raw: string) => raw.slice(0, 300).toLowerCase();

const has = (msg: string, ...needles: string[]) => {
  const m = norm(msg);
  return needles.some((n) => m.includes(n));
};

const RATE_LIMIT: AuthErrorCopy = {
  title: "Too many attempts in a short time.",
  body: "Wait a minute, then try again.",
  field: "form",
};

const UNAVAILABLE = (what: string): AuthErrorCopy => ({
  title: `${what} isn’t available right now.`,
  body: "This is on our side, not yours. Try again in a few minutes.",
  field: "form",
});

const isRate = (raw: string) => has(raw, "rate limit", "too many", "security purposes", "over_email_send_rate");
const isUnavailable = (raw: string) => has(raw, "not available", "signups not allowed", "service unavailable");
const isGoogle = (raw: string) => has(raw, "google", "oauth", "provider");
const isWeakPassword = (raw: string) =>
  has(raw, "password should", "password must", "weak password", "weak_password", "known to be weak", "pwned", "at least 6", "characters");

export function loginError(raw: string): AuthErrorCopy {
  if (isUnavailable(raw)) return UNAVAILABLE("Sign-in");
  if (isRate(raw)) return RATE_LIMIT;
  if (isGoogle(raw)) {
    return { title: "Google sign-in didn’t start.", body: "Try again, or sign in with your email and password below.", field: "google" };
  }
  if (has(raw, "invalid login credentials", "invalid credentials", "invalid_credentials")) {
    return {
      title: "That email and password don’t match.",
      body: "Check both for typos. Signed up with Google? Use Continue with Google instead.",
      field: "password",
      action: { label: "Reset your password", href: "/account/reset-password" },
    };
  }
  if (has(raw, "email not confirmed", "email_not_confirmed")) {
    return {
      title: "Confirm your email first.",
      body: "Open the link we sent when you signed up. Lost it, or it expired? Send a fresh one.",
      field: "email",
      resend: true,
    };
  }
  if (has(raw, "missing email", "email")) {
    return { title: "That email address doesn’t look right.", body: "Check it for typos and try again.", field: "email" };
  }
  return {
    title: "We couldn’t sign you in.",
    body: "Try again. If it keeps happening, reset your password.",
    field: "form",
    action: { label: "Reset your password", href: "/account/reset-password" },
  };
}

export function signupError(raw: string): AuthErrorCopy {
  if (isUnavailable(raw)) return UNAVAILABLE("Sign-up");
  if (isRate(raw)) return RATE_LIMIT;
  if (isGoogle(raw)) {
    return { title: "Google sign-up didn’t start.", body: "Try again, or create an account with your email below.", field: "google" };
  }
  if (has(raw, "already registered", "already exists", "already been registered", "user_already_exists")) {
    return {
      title: "There’s already an account for this email.",
      body: "Sign in instead, or reset the password if you’ve forgotten it.",
      field: "email",
      action: { label: "Sign in", href: "/login" },
    };
  }
  if (isWeakPassword(raw) || has(raw, "password")) {
    return {
      title: "Choose a stronger password.",
      body: "Use at least 6 characters, and avoid common or leaked passwords.",
      field: "password",
    };
  }
  if (has(raw, "email")) return { title: "That email address doesn’t look right.", body: "Check it for typos and try again.", field: "email" };
  return { title: "We couldn’t create your account.", body: "Try again in a moment.", field: "form" };
}

export function updatePasswordError(raw: string): AuthErrorCopy {
  if (isUnavailable(raw)) return UNAVAILABLE("Changing your password");
  if (isRate(raw)) return RATE_LIMIT;
  if (has(raw, "different from the old", "same as", "same_password")) {
    return { title: "That’s your current password.", body: "Choose a new one you haven’t used here before.", field: "password" };
  }
  if (has(raw, "session", "jwt", "expired", "not authenticated", "reauthentication")) {
    return {
      title: "Your reset session has expired.",
      body: "Request a fresh reset link and use it within a few minutes.",
      field: "form",
      action: { label: "Send a new link", href: "/account/reset-password" },
    };
  }
  if (isWeakPassword(raw) || has(raw, "password")) {
    return { title: "Choose a stronger password.", body: "Use at least 6 characters, and avoid common or leaked passwords.", field: "password" };
  }
  return { title: "We couldn’t save that password.", body: "Try again. If it keeps failing, request a new reset link.", field: "form", action: { label: "Send a new link", href: "/account/reset-password" } };
}

/** Outcome of the resend-confirmation action, carried as `?resend=`. */
export type ResendState = "sent" | "rate" | "missing" | "error" | "unavailable";

export function resendNotice(raw: string | undefined): { tone: "success" | "error"; title: string; body?: string } | null {
  switch (raw as ResendState | undefined) {
    case "sent":
      return { tone: "success", title: "A new confirmation link is on its way.", body: "Use the newest email: earlier links stop working once a new one is sent." };
    case "rate":
      return { tone: "error", title: "We just sent one.", body: "Wait a minute before asking for another, and check spam or promotions meanwhile." };
    case "missing":
      return { tone: "error", title: "Enter the email you signed up with.", body: "We’ll send the confirmation link there." };
    case "unavailable":
      return { tone: "error", title: "Resending isn’t available right now.", body: "This is on our side. Try again in a few minutes." };
    case "error":
      return { tone: "error", title: "We couldn’t send that email.", body: "Check the address for typos and try again." };
    default:
      return null;
  }
}

export type LinkErrorKind = "cancelled" | "server" | "expired" | "browser" | "missing" | "unknown";

/** The query string /auth/error can arrive with. `error` is either an OAuth
 *  error (access_denied, server_error) forwarded from the provider, or the raw
 *  message from a failed code exchange. */
export interface LinkErrorParams {
  error?: string;
  error_code?: string;
  error_description?: string;
}

export interface LinkErrorCopy {
  kind: LinkErrorKind;
  /** Short uppercase tag for the page eyebrow. */
  tag: string;
  title: string;
  body: string;
  /** Provider code for support: shown small and secondary, never as the message. */
  reference?: string;
}

/** Only a short, code-shaped token is safe to echo back as a support reference. */
const safeRef = (v: string) => (/^[a-z0-9_.-]{2,48}$/i.test(v) ? v : undefined);

const EXPIRED: Omit<LinkErrorCopy, "reference"> = {
  kind: "expired",
  tag: "Link expired",
  title: "That email link has expired.",
  body: "Links from ProofMart work once, and only for a short time. Your account is fine. Get a fresh link for whatever you were doing.",
};

/** /auth/error: say what actually happened, so the page can offer the one next step that fits. */
export function linkError({ error, error_code, error_description }: LinkErrorParams): LinkErrorCopy {
  const err = (error ?? "").trim();
  const code = (error_code ?? "").trim();
  const desc = (error_description ?? "").trim();
  const all = [err, code, desc].join(" ");

  if (!err && !code && !desc) {
    return {
      kind: "missing",
      tag: "No link found",
      title: "This page opened without a sign-in link.",
      body: "The link from your email may have been cut short when it was copied, or you came here directly. Click the link in the email itself, or pick up below.",
    };
  }
  if (has(code, "otp_expired") || has(all, "expired", "already been used")) {
    return { ...EXPIRED, reference: safeRef(code) };
  }
  if (has(err, "server_error", "temporarily_unavailable") || has(code, "unexpected_failure")) {
    return {
      kind: "server",
      tag: "Server fault",
      title: "Something went wrong on our side.",
      body: "The sign-in service hit a problem while finishing your request. Nothing is wrong with your account, and nothing was changed. Try again in a moment.",
      reference: safeRef(code) ?? safeRef(err),
    };
  }
  if (has(err, "access_denied")) {
    return {
      kind: "cancelled",
      tag: "Google cancelled",
      title: "Google sign‑in was cancelled.",
      body: "Google didn’t hand your account back to us, usually because the window was closed or access wasn’t allowed. You’re not signed in, and nothing was changed.",
    };
  }
  if (has(all, "code verifier", "code_verifier", "flow state", "flow_state", "pkce", "both auth code")) {
    return {
      kind: "browser",
      tag: "Different browser",
      title: "Open the link in the same browser.",
      body: "For your security, a sign-in link only works in the browser that asked for it. Open it there, or start again here.",
      reference: safeRef(code),
    };
  }
  if (has(all, "invalid", "otp")) {
    return { ...EXPIRED, reference: safeRef(code) };
  }
  return {
    kind: "unknown",
    tag: "Sign-in stopped",
    title: "We couldn’t finish signing you in.",
    body: "The sign-in service turned the link down. Start again from whatever you were doing: a fresh attempt usually goes through.",
    reference: safeRef(code) ?? safeRef(err),
  };
}
