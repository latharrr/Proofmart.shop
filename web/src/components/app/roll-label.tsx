import type { ReactNode } from "react";

/**
 * The label of a button whose element isn't a <RollPill> (a
 * `<ConfirmSubmitButton>`, a nav link). Give the host `className="pm-pill"`
 * plus `data-variant` / `data-size` and the button styles apply.
 */
export default function RollLabel({ children }: { children: ReactNode }) {
  return <span className="pm-pill-roll">{children}</span>;
}
