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
  title: string;
  body: string;
  /** Provider code for support — shown small and secondary, never as the message. */
  reference?: string;
}

/** /auth/error — say what actually happened, so the page can offer the one next step that fits. */
export function linkError({ error, error_code, error_description }: LinkErrorParams): LinkErrorCopy {
  const err = (error ?? "").trim();
  const code = (error_code ?? "").trim();
  const desc = (error_description ?? "").trim();
  const all = [err, code, desc].join(" ");

  if (!err && !code && !desc) {
    return {
      kind: "missing",
      title: "This page opened without a sign-in link.",
      body: "That usually means the link from your email was cut short when it was copied, or you came here directly. Go back to the email and click the link itself — or pick up below.",
    };
  }
  if (has(code, "otp_expired") || has(all, "expired", "already been used")) {
    return {
      kind: "expired",
      title: "That email link has expired.",
      body: "Links from ProofMart work once, and only for a short time. Your account is fine — get a fresh link for whatever you were doing.",
    };
  }
  if (has(err, "server_error", "temporarily_unavailable") || has(code, "unexpected_failure")) {
    return {
      kind: "server",
      title: "Something went wrong on our side.",
      body: "The sign-in service hit a problem while finishing your request. Nothing is wrong with your account, and nothing was changed. Try again in a moment.",
      reference: code || err,
    };
  }
  if (has(err, "access_denied")) {
    return {
      kind: "cancelled",
      title: "Google sign\u2011in was cancelled.",
      body: "Google didn’t hand your account back to us — usually because the window was closed or access wasn’t allowed. You’re not signed in, and nothing was changed.",
    };
  }
  if (has(all, "code verifier", "code_verifier", "flow state", "pkce", "both auth code")) {
    return {
      kind: "browser",
      title: "Open the link in the same browser.",
      body: "For your security, a sign-in link only works in the browser that asked for it. Open it there — or just sign in again here.",
    };
  }
  if (has(all, "invalid", "otp")) {
    return {
      kind: "expired",
      title: "That email link has expired.",
      body: "Links from ProofMart work once, and only for a short time. Your account is fine — get a fresh link for whatever you were doing.",
    };
  }
  return {
    kind: "unknown",
    title: "We couldn’t finish signing you in.",
    body: "The sign-in service turned the link down. Start again from whatever you were doing — a fresh attempt usually goes through.",
    reference: code || err,
  };
}
