import type { CSSProperties, ElementType, ReactNode } from "react";

/** Retired with the crosshair grid; renders nothing so stale imports are harmless. */
export function Crosshair(_props: { className?: string; style?: CSSProperties }) {
  void _props;
  return null;
}

/**
 * A sheet on the desk: one bordered surface (`.pm-frame`) holding a stage,
 * with an optional caption ruled off along its foot, the way a working paper
 * carries its reference line. `tone` picks the stock: paper (the pad),
 * sheet (lighter, for working panels), haze (the deeper pad green) or ink
 * (graphite, reserved for secrets shown once).
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
