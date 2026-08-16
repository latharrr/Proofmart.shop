import Link from "next/link";
import type { ReactNode } from "react";
import { MONO, SANS } from "@/lib/evidence-data";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "#FFFFFF",
      }}
    >
      <Link
        href="/"
        className="pm-hoverable"
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}
      >
        <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
          <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
        </div>
        <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17, color: "#0E1216" }}>
          ProofMart
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 360 }}>
        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", margin: "0 0 6px" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83", margin: "0 0 28px", lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
        {!subtitle && <div style={{ marginBottom: 28 }} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>

        {footer && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #DDE1E4",
              fontFamily: MONO,
              fontSize: 12,
              color: "#767C83",
              textAlign: "center",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
