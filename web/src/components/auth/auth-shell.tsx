import type { ReactNode } from "react";
import Wordmark from "@/components/brand/wordmark";

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
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "var(--pm-paper)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ marginBottom: 40 }}>
          <Wordmark href="/" />
        </div>

        {/* Serif, because this is the page's display line and the system puts
            serif at 44px and nothing smaller. */}
        <h1 className="pm-h2" style={{ fontSize: 44, marginBottom: subtitle ? 12 : 32 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="pm-body" style={{ color: "var(--pm-slate)", margin: "0 0 32px" }}>
            {subtitle}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>

        {footer && (
          <div
            className="pm-body"
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: "1px solid var(--pm-hairline)",
              color: "var(--pm-slate)",
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
