"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * WAI-ARIA tabs: ←/→ (and Home/End) move between tabs and select them,
 * only the selected tab is in the tab order, each panel is labelled by its
 * tab. `onChange` lets a parent react (e.g. restart a typed run).
 */
export default function Tabs({
  label,
  tabs,
  className = "pm-tabs",
  onChange,
  extra,
}: {
  label: string;
  tabs: { id: string; label: ReactNode; content: ReactNode }[];
  className?: string;
  onChange?: (id: string) => void;
  /** Rendered at the end of the tab strip (e.g. a copy button). */
  extra?: ReactNode;
}) {
  const [active, setActive] = useState(tabs[0].id);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  // One --signal indicator that slides to the selected tab.
  useLayoutEffect(() => {
    const place = () => {
      const tab = refs.current[tabs.findIndex((t) => t.id === active)];
      if (!tab || !bar.current) return;
      bar.current.style.transform = `translateX(${tab.offsetLeft + 16}px) scaleX(${Math.max(1, tab.offsetWidth - 32)})`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active, tabs]);

  const select = (i: number) => {
    setActive(tabs[i].id);
    onChange?.(tabs[i].id);
    refs.current[i]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((t) => t.id === active);
    const next = e.key === "ArrowRight" ? (at + 1) % tabs.length : e.key === "ArrowLeft" ? (at - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
  };

  return (
    <div className={className}>
      <div className="pm-tabs-strip">
        <div role="tablist" aria-label={label} className="pm-tabs-list" onKeyDown={onKey}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-t-${t.id}`}
              aria-controls={`${base}-p-${t.id}`}
              aria-selected={t.id === active}
              tabIndex={t.id === active ? 0 : -1}
              className="pm-tab"
              onClick={() => select(i)}
            >
              {t.label}
            </button>
          ))}
          <span ref={bar} className="pm-tabs-bar" aria-hidden="true" />
        </div>
        {extra}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-p-${t.id}`} aria-labelledby={`${base}-t-${t.id}`} hidden={t.id !== active} className="pm-tabs-panel" tabIndex={0}>
          {t.id === active ? t.content : null}
        </div>
      ))}
    </div>
  );
}
