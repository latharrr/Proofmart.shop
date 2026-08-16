import type { CSSProperties } from "react";
import { MONO, SANS } from "@/lib/evidence-data";

// Shared styling for the auth pages (login/signup/reset/update-password) —
// same visual system as the rest of the marketing site (topbar.tsx,
// hero.tsx): inline styles, MONO/SANS tokens, the ink/border/muted palette.
// Pulled into one place because these four pages share an identical form
// shape, not because it needs to be reusable elsewhere.

export const label: CSSProperties = {
  display: "block",
  fontFamily: MONO,
  fontSize: 11,
  color: "#767C83",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

export const input: CSSProperties = {
  width: "100%",
  fontFamily: SANS,
  fontSize: 14,
  color: "#0E1216",
  padding: "10px 12px",
  border: "1px solid #DDE1E4",
  borderRadius: 3,
  background: "#FFFFFF",
};

export const primaryButton: CSSProperties = {
  width: "100%",
  fontFamily: MONO,
  fontSize: 12,
  letterSpacing: "0.06em",
  padding: "12px 18px",
  background: "#0E1216",
  color: "#F5F5F0",
  borderRadius: 3,
  textAlign: "center",
};

export const secondaryButton: CSSProperties = {
  width: "100%",
  fontFamily: MONO,
  fontSize: 12,
  letterSpacing: "0.04em",
  padding: "12px 18px",
  border: "1px solid #DDE1E4",
  color: "#0E1216",
  borderRadius: 3,
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export const helperText: CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  color: "#767C83",
  lineHeight: 1.5,
};

export const errorBanner: CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  color: "#B4231F",
  background: "#FBEAE9",
  border: "1px solid #F1C7C5",
  borderRadius: 3,
  padding: "10px 12px",
  lineHeight: 1.4,
};

export const successBanner: CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  color: "#1F6B4A",
  background: "#EAF3EE",
  border: "1px solid #C7DFD1",
  borderRadius: 3,
  padding: "10px 12px",
  lineHeight: 1.4,
};
