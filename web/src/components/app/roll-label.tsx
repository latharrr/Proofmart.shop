import type { ReactNode } from "react";

/**
 * The rolling-label markup of a pill (design-system.md §5), for buttons whose
 * element isn't a <RollPill> — a `<ConfirmSubmitButton>` or a nav link. Give
 * the host `className="pm-pill"` (plus `data-variant` / `data-size`) and the
 * foundation styles do the rest; inside the app bar the nav rules drive it.
 */
export default function RollLabel({ children }: { children: ReactNode }) {
  return (
    <span className="pm-pill-roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
