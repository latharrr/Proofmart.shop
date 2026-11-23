import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Marks a block for the motion layer's entrance (y 16→0 + fade, once, at
 * 85% of the viewport; motion-layer.tsx). Visible at rest without script and
 * under reduced motion. `delay` staggers siblings in ms.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay,
  className,
  style,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  [attr: string]: unknown;
}) {
  return (
    <Tag className={className} style={delay ? { ...style, ["--d" as string]: `${delay}ms` } : style} data-reveal="" {...rest}>
      {children}
    </Tag>
  );
}
