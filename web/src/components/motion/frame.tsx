import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Crosshair `+` mark — design-system.md §3: 13px, ink at 40%, same size and
 * colour everywhere. Drawn with CSS bars so it is pixel-crisp at any DPR.
 */
export function Crosshair({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={className ? `pm-cross ${className}` : "pm-cross"} style={style} aria-hidden="true" />;
}

/**
 * Framed stage — bar.md §6. A 20px-radius stage with a row of `+` marks above
 * and/or below it: one at each corner (aligned to the stage's outer edges, as
 * lusion.co does) and one on each internal column line.
 *
 *   <Frame columns={4} tone="graphite" aspect="16 / 8" label="Scroll to explore">
 *     <DocumentStage variant="hero" />
 *   </Frame>
 *
 * The mark rows are in normal flow (13px + 10px gap each), so nothing overlaps
 * neighbouring content. The stage clips its children to the radius.
 */
export default function Frame({
  children,
  columns = 1,
  marks = "both",
  tone,
  aspect,
  label,
  as: Tag = "div",
  className,
  style,
  stageClassName,
  stageStyle,
}: {
  children?: ReactNode;
  /** Equal columns; a mark is drawn on every internal column line. 1 = corners only. */
  columns?: number;
  /** Which edges carry a mark row. */
  marks?: "both" | "top" | "bottom" | "none";
  /** Stage background. graphite = the dark 3D stage (with a soft vignette). */
  tone?: "graphite" | "paper" | "haze" | "field";
  /** CSS aspect-ratio for the stage, e.g. "16 / 9". Omit to size by content or stageStyle. */
  aspect?: string;
  /** Optional label centred in the bottom mark row (renders as a .pm-t-label). */
  label?: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  stageClassName?: string;
  stageStyle?: CSSProperties;
}) {
  const row = (edge: "top" | "bottom") => (
    <div className="pm-frame-marks" data-edge={edge} aria-hidden={edge === "top" || !label ? true : undefined}>
      <Crosshair />
      {Array.from({ length: Math.max(0, columns - 1) }, (_, i) => i).filter(
        // The centred label takes the middle column line's place.
        (i) => !(edge === "bottom" && label && (i + 1) / columns === 0.5),
      ).map((i) => (
        <span
          key={i}
          className="pm-cross"
          data-col=""
          aria-hidden="true"
          style={{ ["--col" as string]: String((i + 1) / columns) }}
        />
      ))}
      {edge === "bottom" && label ? <span className="pm-frame-label pm-t-label">{label}</span> : null}
      <Crosshair />
    </div>
  );

  return (
    <Tag className={className ? `pm-frame ${className}` : "pm-frame"} data-tone={tone} style={style}>
      {marks === "both" || marks === "top" ? row("top") : null}
      <div
        className={stageClassName ? `pm-frame-stage ${stageClassName}` : "pm-frame-stage"}
        style={aspect ? { aspectRatio: aspect, ...stageStyle } : stageStyle}
      >
        {children}
      </div>
      {marks === "both" || marks === "bottom" ? row("bottom") : null}
    </Tag>
  );
}
