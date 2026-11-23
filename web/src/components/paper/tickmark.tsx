import type { CSSProperties } from "react";

/**
 * The status glyph set (DESIGN.md, Iconography): check, cross, query, dash.
 * Every verdict carries its glyph beside its word, so it reads without
 * colour. Straight strokes, square caps, paths only, in currentColor, on a
 * 16-unit grid. (The component keeps its old name so call sites resolve.)
 */
export type TickKind = "agreed" | "footed" | "crossfooted" | "query" | "break" | "none";

const PATHS: Record<TickKind, string[]> = {
  agreed: ["M3 8.4 6.4 11.8 13 4.6"],
  footed: ["M2.6 7.4 5.8 10.4 13.2 2.6", "M3 14h10"],
  crossfooted: ["M2.6 6.4 5.8 9.4 13.2 1.8", "M3 12.2h10", "M3 14.8h10"],
  query: ["M5.4 5.4V3.4h5.2v4H8v2.4", "M8 12.6v.4"],
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
  /** A spoken name; omit when the glyph sits beside its own word. */
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
        <path key={d} d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
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

/** The arrow used for forward/back/down actions, in the glyph stroke. */
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
