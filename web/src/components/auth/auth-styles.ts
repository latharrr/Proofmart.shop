import type { CSSProperties } from "react";

// Shared styling for the auth pages (login/signup/reset/update-password) and
// for the small forms on /account/*. One module because those pages share an
// identical form shape — and because it is the single place that decides what
// an input and a button look like everywhere outside the marketing page.
//
// Everything here reads the design-system tokens in globals.css rather than
// repeating hex values, so the app and the marketing page cannot drift.

export const label: CSSProperties = {
  display: "block",
  fontFamily: "var(--pm-sans)",
  fontSize: 15,
  fontWeight: 450,
  color: "var(--pm-ash)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export const input: CSSProperties = {
  width: "100%",
  fontFamily: "var(--pm-sans)",
  fontSize: 17,
  color: "var(--pm-ink)",
  padding: "12px 16px",
  border: "1px solid var(--pm-hairline)",
  borderRadius: "var(--pm-r-input)",
  background: "var(--pm-mist)",
  outlineOffset: 2,
};

/** Fill and border swap on hover via `.pm-btn`; these carry only layout. */
export const primaryButton: CSSProperties = {
  width: "100%",
};

export const secondaryButton: CSSProperties = {
  width: "100%",
  gap: 10,
};

export const helperText: CSSProperties = {
  fontFamily: "var(--pm-sans)",
  fontSize: 17,
  color: "var(--pm-slate)",
  lineHeight: 1.5,
};

// Error and success are the two verdict colours doing the job they encode —
// a failed state and a clear one. That is semantic signal, not the decorative
// use the system forbids: an achromatic error banner would be a worse form.
export const errorBanner: CSSProperties = {
  fontFamily: "var(--pm-sans)",
  fontSize: 17,
  color: "var(--pm-fail)",
  background: "rgba(180, 35, 31, 0.07)",
  border: "1px solid rgba(180, 35, 31, 0.25)",
  borderRadius: "var(--pm-r-input)",
  padding: "12px 16px",
  lineHeight: 1.45,
};

export const successBanner: CSSProperties = {
  fontFamily: "var(--pm-sans)",
  fontSize: 17,
  color: "var(--pm-clear)",
  background: "rgba(31, 107, 74, 0.07)",
  border: "1px solid rgba(31, 107, 74, 0.25)",
  borderRadius: "var(--pm-r-input)",
  padding: "12px 16px",
  lineHeight: 1.45,
};
