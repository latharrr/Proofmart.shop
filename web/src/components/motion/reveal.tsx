import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * A plain wrapper. The working-paper system has no scroll entrances: a sheet
 * is on the desk before you look at it, so content is always visible and only
 * pencil marks move (DESIGN.md, Motion). Kept as a component so call sites
 * can name a semantic element and pass attributes through.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay: _delay,
  className,
  style,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  /** Accepted for older call sites; nothing is delayed. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  [attr: string]: unknown;
}) {
  void _delay;
  return (
    <Tag className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
