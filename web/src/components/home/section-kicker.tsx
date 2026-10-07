import type { ReactNode } from "react";

/** Section label: number, a short rule, the name — `label` type (§1). */
export default function SectionKicker({ n, children, tone }: { n: string; children: ReactNode; tone?: "dark" }) {
  return (
    <p className="pm-t-label pm-mk-kicker" data-tone={tone}>
      <span className="pm-mk-kicker-n">{n}</span>
      <span className="pm-mk-kicker-rule" aria-hidden="true" />
      {children}
    </p>
  );
}
