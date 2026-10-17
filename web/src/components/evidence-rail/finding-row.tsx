"use client";

import type { CSSProperties } from "react";
import type { RailFinding } from "@/lib/pdf/types";
import Tickmark, { Ident } from "@/components/paper/tickmark";
import { TONE } from "./verdict-tone";

/**
 * One row in the Evidence Rail's findings panel: a ruled entry on the
 * working paper, its address in the left margin, the marker in mono, the
 * verdict as a pencil tickmark and word, the description, and the
 * arithmetic set as a footing.
 *
 * The verdict colour is fixed to what the finding *is*. Hover, focus and the
 * pinned state are carried by achromatic fills and the ink address only:
 * a verdict colour never appears or changes because of the pointer.
 *
 * An extracted fact always carries `verdict: "INCONCLUSIVE"` and no
 * arithmetic, so it renders with the neutral "EXTRACTED" badge.
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
  const v = TONE[finding.verdict];
  const addrId = `addr-${finding.id}`;
  const verdictLabel = finding.origin === "extracted-fact" ? "EXTRACTED" : finding.verdict;

  return (
    <button
      type="button"
      className="pm-mk-frow"
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
      <span className="pm-mk-frow-addr" id={addrId}>
        {/* A zero-width space after each comma lets a multi-row address
            (p2·r04,r07) wrap between rows rather than mid-row. */}
        <span>{finding.addr1.replace(/,/g, ",​")}</span>
        <span>{finding.addr2}</span>
      </span>
      <span className="pm-mk-frow-main">
        <span className="pm-mk-frow-top">
          <span className="pm-mk-frow-id">
            <Ident>{finding.marker}</Ident>
          </span>
          <span className="pm-mk-verdict" data-size="sm" data-tone={finding.origin === "extracted-fact" ? "INCONCLUSIVE" : finding.verdict}>
            <Tickmark kind={v.tick} size={14} />
            {verdictLabel}
          </span>
        </span>
        <span className="pm-mk-frow-desc">{finding.explanation}</span>
        {finding.arithmetic && <span className="pm-mk-frow-math pm-finding-arith">{finding.arithmetic}</span>}
      </span>
    </button>
  );
}
