"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal } from "./use-reveal";

/**
 * Block reveal — design-system.md §6. Rises 32px and fades in over 900ms on
 * --ease-scene when it enters the viewport. Visible at rest without JS
 * (layout.tsx <noscript>) and under reduced motion.
 *
 * For text headings use <LineReveal> instead; this is for non-text blocks
 * (cards, media, stages) and supporting paragraphs.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
  style,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  /** Stagger offset in ms (siblings: i * 80). */
  delay?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className" | "style">) {
  const [ref, state] = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={className ? `pm-rise ${className}` : "pm-rise"}
      data-reveal={state}
      style={delay ? { ...style, ["--pm-delay" as string]: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
