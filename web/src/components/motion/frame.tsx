import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * A card: one 1px-bordered surface (`.pm-frame`, radius 6px, no shadow)
 * holding a stage, with an optional mono caption ruled off along its foot.
 * `tone` picks the stock: paper, sheet (the same paper, kept for call
 * sites), haze (--paper-2) or ink (inverted, for secrets shown once).
 */
export default function Frame({
  as: Tag = "div",
  children,
  tone = "paper",
  aspect,
  label,
  className,
  style,
  stageClassName,
  stageStyle,
}: {
  children?: ReactNode;
  /** Accepted for older call sites; the sheet has no crosshair columns. */
  columns?: number;
  marks?: "both" | "top" | "bottom" | "none";
  tone?: "graphite" | "paper" | "haze" | "field" | "sheet" | "ink";
  aspect?: string;
  label?: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  stageClassName?: string;
  stageStyle?: CSSProperties;
}) {
  const t = tone === "graphite" ? "sheet" : tone === "field" ? "paper" : tone;
  return (
    <Tag className={className ? `pm-frame ${className}` : "pm-frame"} data-tone={t} style={style}>
      <div className={stageClassName ? `pm-frame-stage ${stageClassName}` : "pm-frame-stage"} style={aspect ? { ...stageStyle, aspectRatio: aspect } : stageStyle}>
        {children}
      </div>
      {label ? <div className="pm-frame-label">{label}</div> : null}
    </Tag>
  );
}
