"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useLayoutEffect,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { useReveal } from "./use-reveal";

/**
 * Masked line reveal — design-system.md §6, bar.md §3.
 *
 * Splits the heading into words, each in its own overflow-hidden box, then
 * measures the rendered layout and gives every word its line index. Words on
 * the same line rise together from translateY(105%) — 900ms, --ease-scene,
 * 80ms per line — which reads exactly as a per-line mask but survives any
 * reflow: on resize only the indices are re-measured, nothing is re-rendered.
 *
 * Children may be plain text with inline elements mixed in, e.g.
 *   <LineReveal as="h1" className="pm-t-display">
 *     Every finding, <em className="accent">pinned</em> to its pixel
 *   </LineReveal>
 * Strings are split on whitespace; each element is kept whole as one "word".
 * Use `<br />` for a forced break.
 */

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Extra delay before the first line, in ms. */
  delay?: number;
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className" | "style" | "id">;

function toWords(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const push = (node: ReactNode) => {
    out.push(
      <span className="pm-lines-word" key={key++}>
        <span>{node}</span>
      </span>,
    );
  };
  Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === "boolean") return;
    if (typeof child === "string" || typeof child === "number") {
      const parts = String(child).split(/(\s+)/);
      for (const part of parts) {
        if (part === "") continue;
        if (/^\s+$/.test(part)) out.push(<Fragment key={key++}> </Fragment>);
        else push(part);
      }
      return;
    }
    if (isValidElement(child) && child.type === "br") {
      out.push(<br key={key++} />);
      return;
    }
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...toWords((child.props as { children?: ReactNode }).children));
      return;
    }
    push(child);
  });
  return out;
}

export default function LineReveal({ children, as: Tag = "div", className, style, delay = 0, ...rest }: Props) {
  const [ref, state] = useReveal<HTMLElement>();

  // Assign --line per word from its rendered offsetTop; redo on reflow.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const words = el.querySelectorAll<HTMLElement>(".pm-lines-word");
      let line = -1;
      let lastTop = -Infinity;
      words.forEach((w) => {
        const top = w.offsetTop;
        if (top > lastTop + 2) {
          line += 1;
          lastTop = top;
        }
        w.style.setProperty("--line", String(line));
      });
    };
    measure();
    let width = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth !== width) {
        width = el.offsetWidth;
        measure();
      }
    });
    ro.observe(el);
    // Web fonts can change line breaks after first paint.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [ref, children]);

  return (
    <Tag
      ref={ref}
      className={className ? `pm-lines ${className}` : "pm-lines"}
      data-reveal={state}
      style={delay ? { ...style, ["--pm-delay" as string]: `${delay}ms` } : style}
      {...rest}
    >
      {toWords(children)}
    </Tag>
  );
}
