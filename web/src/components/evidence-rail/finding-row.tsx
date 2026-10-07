"use client";

import { MONO, SANS, VERDICT } from "@/lib/evidence-data";
import type { RailFinding } from "@/lib/pdf/types";

/**
 * One row in a findings panel — shared by the live rail (evidence-rail.tsx)
 * and the saved-document viewer (documents/[id]). An extracted fact always
 * carries `verdict: "INCONCLUSIVE"` and no arithmetic, so it renders with
 * the same neutral gray "EXTRACTED" badge; a real verification finding
 * renders with its own FAIL/REVIEW/CLEAR/INCONCLUSIVE color and, when
 * present, the same arithmetic evidence block.
 */
export function FindingRow({
  finding,
  isActive,
  isPinned,
  onHover,
  onPin,
}: {
  finding: RailFinding;
  isActive: boolean;
  isPinned: boolean;
  onHover: (id: string | null) => void;
  onPin: (updater: (prev: string | null) => string | null) => void;
}) {
  const v = VERDICT[finding.verdict];
  const addrId = `addr-${finding.id}`;
  const verdictLabel = finding.origin === "extracted-fact" ? "EXTRACTED" : finding.verdict;

  return (
    <button
      aria-describedby={addrId}
      aria-pressed={isPinned}
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(finding.id)}
      onBlur={() => onHover(null)}
      onClick={() => onPin((prev) => (prev === finding.id ? null : finding.id))}
      style={{
        display: "block",
        width: "100%",
        // A <button> centres its text by default; a finding is read, not clicked past.
        textAlign: "left",
        background: isActive ? v.fill : "transparent",
        borderLeft: isPinned ? `2px solid ${v.color}` : "2px solid transparent",
        transition: "background-color 120ms cubic-bezier(0.2,0,0,1)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "76px minmax(0, 1fr)", gap: 0, padding: "14px 0", borderBottom: "1px solid #DDE1E4", width: "100%", alignItems: "start" }}>
        <div id={addrId} style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", padding: "0 8px 0 14px", lineHeight: "16px", overflowWrap: "anywhere" }}>
          {/* A zero-width space after each comma lets a multi-row address
              (p2·r04,r07) wrap between rows rather than mid-row. */}
          <div>{finding.addr1.replace(/,/g, ",\u200b")}</div>
          <div style={{ marginTop: 2 }}>{finding.addr2}</div>
        </div>
        <div style={{ paddingRight: 16, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "2px 12px" }}>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: "#0E1216", letterSpacing: "0.02em" }}>{finding.marker}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: v.color,
                whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden="true" style={{ display: "inline-block", width: 12, textAlign: "center", fontWeight: 500 }}>
                {v.glyph}
              </span>
              {verdictLabel}
            </span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: "20px", color: "#43494F", marginTop: 6 }}>{finding.explanation}</div>
          {finding.arithmetic && (
            <div
              className="pm-finding-arith"
              style={{
                marginTop: 8,
                padding: "8px 10px",
                background: "#EDEFF1",
                borderLeft: `2px solid ${v.color}`,
                fontFamily: MONO,
                fontSize: 12,
                lineHeight: "18px",
                color: "#0E1216",
                whiteSpace: "pre-line",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {finding.arithmetic}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
