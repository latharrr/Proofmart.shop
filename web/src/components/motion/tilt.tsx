import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Two nested boxes, flat. Sheets in the working-paper system lie on the desk
 * and never tilt toward the pointer; the outer/inner pair is kept so existing
 * layouts that style both still resolve.
 */
export default function Tilt({
  children,
  as: Tag = "div",
  className,
  style,
  innerClassName,
  innerStyle,
  max: _max,
  damping: _damping,
}: {
  children: ReactNode;
  max?: number;
  damping?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  innerClassName?: string;
  innerStyle?: CSSProperties;
}) {
  void _max;
  void _damping;
  return (
    <Tag className={className} style={style}>
      <div className={innerClassName} style={innerStyle}>
        {children}
      </div>
    </Tag>
  );
}
