import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * A heading, set and still. The name survives from the previous system so
 * call sites keep working; headings in the working-paper system never animate
 * (only pencil marks do).
 */
export default function LineReveal({
  children,
  as: Tag = "div",
  className,
  style,
  delay: _delay,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
  delay?: number;
  [attr: string]: unknown;
}) {
  void _delay;
  return (
    <Tag className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
