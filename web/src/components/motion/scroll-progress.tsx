import type { CSSProperties, ElementType, ReactNode } from "react";

export type ScrollRange = "cover" | "enter" | "exit";

/**
 * A plain wrapper. Scroll-linked depth belonged to the previous system; the
 * working-paper pages do not move with the scroll.
 */
export function ScrollVar({
  as: Tag = "div",
  children,
  className,
  style,
}: {
  as?: ElementType;
  children?: ReactNode;
  range?: ScrollRange;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}
