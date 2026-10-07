// The server actions redirect back with the raw provider message in `?error=`.
// That message is accurate but written for developers ("Invalid login
// credentials"). This module turns it into what a person needs: what went
// wrong, which field caused it, and what to do next. The raw text is never
// thrown away — anything unrecognised is shown as-is.

export type AuthField = "email" | "password" | "google" | "form";

export interface AuthErrorCopy {
  /** One sentence: what went wrong. */
  title: string;
  /** What to do about it. */
  body?: string;
  /** Which control the message belongs next to. */
  field: AuthField;
  /** An optional way out, rendered as an inline link. */
  action?: { label: string; href: string };
}

const has = (msg: string, ...needles: string[]) => {
  const m = msg.toLowerCase();
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

export function loginError(raw: string): AuthErrorCopy {
  if (has(raw, "not available")) return UNAVAILABLE("Sign-in");
  if (has(raw, "google", "oauth", "provider")) {
    return { title: "Google sign-in didn’t start.", body: "Try again, or sign in with your email and password below.", field: "google" };
  }
  if (has(raw, "invalid login credentials", "invalid credentials")) {
    return {
      title: "That email and password don’t match.",
      body: "Check both for typos. If you signed up with Google, use Continue with Google instead.",
      field: "password",
      action: { label: "Reset your password", href: "/account/reset-password" },
    };
  }
  if (has(raw, "email not confirmed")) {
    return {
      title: "Confirm your email first.",
      body: "Open the confirmation link we sent when you signed up — check spam if it isn’t in your inbox.",
      field: "email",
    };
  }
  if (has(raw, "rate limit", "too many", "security purposes")) return RATE_LIMIT;
  return { title: raw, body: "Try again. If it keeps happening, reset your password.", field: "form" };
}

export function signupError(raw: string): AuthErrorCopy {
  if (has(raw, "not available")) return UNAVAILABLE("Sign-up");
  if (has(raw, "google", "oauth", "provider")) {
    return { title: "Google sign-up didn’t start.", body: "Try again, or create an account with your email below.", field: "google" };
  }
  if (has(raw, "already registered", "already exists", "already been registered")) {
    return {
      title: "There’s already an account for this email.",
      body: "Sign in instead — or reset the password if you’ve forgotten it.",
      field: "email",
      action: { label: "Sign in", href: "/login" },
    };
  }
  if (has(raw, "password")) return { title: raw.replace(/\.?$/, "."), body: "Choose a longer or less common password.", field: "password" };
  if (has(raw, "email")) return { title: "That email address doesn’t look right.", body: "Check it for typos and try again.", field: "email" };
  if (has(raw, "rate limit", "too many", "security purposes")) return RATE_LIMIT;
  return { title: raw, body: "Try again in a moment.", field: "form" };
}

export function updatePasswordError(raw: string): AuthErrorCopy {
  if (has(raw, "not available")) return UNAVAILABLE("Changing your password");
  if (has(raw, "different from the old", "same as")) {
    return { title: "That’s your current password.", body: "Choose a new one you haven’t used here before.", field: "password" };
  }
  if (has(raw, "session", "jwt", "expired", "not authenticated")) {
    return {
      title: "Your reset session has expired.",
      body: "Request a fresh reset link and use it within a few minutes.",
      field: "form",
      action: { label: "Send a new link", href: "/account/reset-password" },
    };
  }
  if (has(raw, "rate limit", "too many", "security purposes")) return RATE_LIMIT;
  return { title: raw.replace(/\.?$/, "."), body: "Choose a longer or less common password.", field: "password" };
}

export type LinkErrorKind = "browser" | "expired" | "unknown";

/** /auth/error — the code-exchange failed, or the link arrived without a code. */
export function linkError(raw: string | undefined): { kind: LinkErrorKind; title: string; body: string } {
  if (raw && has(raw, "code verifier", "code_verifier", "flow state", "pkce", "both auth code")) {
    return {
      kind: "browser",
      title: "Open the link in the same browser.",
      body: "For your security, a sign-in link only works in the browser that asked for it. Open it there — or just sign in again here.",
    };
  }
  if (raw && has(raw, "expired", "invalid", "otp", "already been used", "used")) {
    return {
      kind: "expired",
      title: "That link has expired.",
      body: "Email links from ProofMart work once and only for a short time. Nothing is wrong with your account — get a fresh link below.",
    };
  }
  return {
    kind: "unknown",
    title: "That link didn’t work.",
    body: "It may have expired, been used already, or been cut short by your email app. Pick up again from whatever you were doing below.",
  };
}
