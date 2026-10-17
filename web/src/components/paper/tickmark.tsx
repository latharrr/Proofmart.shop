import type { CSSProperties } from "react";

/**
 * The tickmark set: the icon system of the working-paper world. Auditors mark
 * every figure they have checked with a small pencil sign and explain the
 * signs in a legend at the foot of the sheet; ProofMart's verdicts use the
 * same signs, so a state reads by its mark before its colour (DESIGN.md,
 * Tickmarks). Drawn as paths only, in currentColor, on a 16-unit grid.
 */
export type TickKind = "agreed" | "footed" | "crossfooted" | "query" | "break" | "none";

const PATHS: Record<TickKind, string[]> = {
  agreed: ["M2.6 8.7 6.1 12.1 13.6 3.6"],
  footed: ["M2.6 7.4 5.8 10.4 13.2 2.6", "M3 14h10"],
  crossfooted: ["M2.6 6.4 5.8 9.4 13.2 1.8", "M3 12.2h10", "M3 14.8h10"],
  query: ["M5.2 5.6c0-1.9 1.3-3.1 3-3.1s3 1.1 3 2.7c0 1.4-.8 2.1-1.9 2.7-.9.5-1.3 1.1-1.3 2.1v.6", "M8 13.2v.6"],
  break: ["M3.4 3.4 12.6 12.6", "M12.6 3.4 3.4 12.6"],
  none: ["M3.5 8h9"],
};

export default function Tickmark({
  kind,
  size = 16,
  className,
  style,
  title,
}: {
  kind: TickKind;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** A spoken name; omit when the mark sits beside its own word. */
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className ? `pm-tick ${className}` : "pm-tick"}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-kind={kind}
    >
      {PATHS[kind].map((d) => (
        <path key={d} d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

/** Which sign a verdict is written with. */
export const VERDICT_TICK: Record<"FAIL" | "REVIEW" | "CLEAR" | "INCONCLUSIVE", TickKind> = {
  FAIL: "break",
  REVIEW: "query",
  CLEAR: "agreed",
  INCONCLUSIVE: "none",
};

/**
 * A pencil ring drawn round a figure: an open ellipse that overshoots its
 * start the way a hand-drawn circle does. Absolutely positioned over its
 * parent, which must be `position: relative`.
 */
export function PencilRing({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className ? `pm-ring ${className}` : "pm-ring"} style={style} viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M14 22C11 9 64 3.5 104 8.5c13 1.6 15 12.6 3 18.2C88 35.5 30 37 13 28 4.5 23.5 10 12.5 34 9"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The pencil arrow used for forward/back/down actions, in the tickmark stroke. */
export function Arrow({ dir = "right", size = 14, className }: { dir?: "right" | "left" | "down"; size?: number; className?: string }) {
  const d =
    dir === "left"
      ? "M12 7.2H2.8M6.4 3.4 2.6 7.2 6.4 11"
      : dir === "down"
        ? "M7 2v9.2M3.2 7.6 7 11.4l3.8-3.8"
        : "M2 7.2h9.2M7.6 3.4 11.4 7.2 7.6 11";
  return (
    <svg className={className ? `pm-arrow ${className}` : "pm-arrow"} width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}

/** A machine identifier with a break opportunity after each underscore, so it wraps between words, never mid-token. */
export function Ident({ children }: { children: string }) {
  const parts = children.split(/(?<=_)/);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <wbr />}
        </span>
      ))}
    </>
  );
}
