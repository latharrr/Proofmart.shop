"use client";

import type { CSSProperties } from "react";
import type { RailFinding } from "@/lib/pdf/types";
import Tickmark, { Arrow, Ident } from "@/components/paper/tickmark";
import { TONE } from "./verdict-tone";

/**
 * One row of the Evidence Rail's findings index: No. / Marker / Verdict /
 * Cite / ↗ on one line, then the plain finding and, where the marker did
 * arithmetic, the mono ledger it worked (`opening + credit − debit = expected`
 * against what the document prints).
 *
 * The verdict colour is fixed to what the finding *is*. Hover and focus move
 * the row and turn the arrow --signal; the pinned row carries its verdict's
 * wash. An extracted fact carries `verdict: "INCONCLUSIVE"` and no
 * arithmetic, so it renders with the neutral "EXTRACTED" pill.
 */
export function FindingRow({
  n,
  finding,
  isActive,
  isPinned,
  onHover,
  onPin,
  preview,
}: {
  /** "sample:N" for a sample finding: the motion layer trails a thumbnail of that page. */
  preview?: string;
  n: number;
  finding: RailFinding;
  isActive: boolean;
  isPinned: boolean;
  onHover: (id: string | null) => void;
  onPin: (updater: (prev: string | null) => string | null) => void;
}) {
  const v = TONE[finding.verdict];
  const addrId = `addr-${finding.id}`;
  const fact = finding.origin === "extracted-fact";

  return (
    <button
      type="button"
      className="pm-frow"
      data-cursor="inspect"
      data-preview={preview}
      aria-describedby={addrId}
      aria-pressed={isPinned}
      data-active={isActive ? "" : undefined}
      data-pinned={isPinned ? "" : undefined}
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(finding.id)}
      onBlur={() => onHover(null)}
      onClick={() => onPin((prev) => (prev === finding.id ? null : finding.id))}
      style={{ ["--v" as string]: v.color, ["--v-wash" as string]: v.wash } as CSSProperties}
    >
      <span className="pm-frow-line">
        <span className="pm-frow-n">{String(n).padStart(2, "0")}</span>
        <span className="pm-frow-id">
          <Ident>{finding.marker}</Ident>
        </span>
        <span className="pm-mk-verdict" data-size="sm" data-tone={fact ? "INCONCLUSIVE" : finding.verdict}>
          <Tickmark kind={v.tick} size={12} />
          {fact ? "EXTRACTED" : finding.verdict}
        </span>
        {/* A zero-width space after each comma lets a multi-row address
            (p2·r04,r07) wrap between rows rather than mid-row. */}
        <span className="pm-frow-cite" id={addrId}>
          {finding.addr1.replace(/,/g, ",​")}
        </span>
        <span className="pm-frow-go" aria-hidden="true">
          <Arrow size={13} />
        </span>
      </span>
      <span className="pm-frow-desc">{finding.explanation}</span>
      {finding.arithmetic && (
        // One span per ledger line; on a FAIL the lines after the first are
        // what the document prints, marked ≠ (CSS) against the expected sum.
        <span className="pm-frow-math pm-finding-arith">
          {finding.arithmetic.split("\n").map((line, i) => (
            <span key={i} className="pm-math-line" data-neq={finding.verdict === "FAIL" && i > 0 ? "" : undefined}>
              {line}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
