import type { DocumentStatus } from "@/lib/documents";

/**
 * Verdict display for the workspace. Colours are the three verdict tokens and
 * nothing else; INCONCLUSIVE is not a verdict colour, so it stays achromatic.
 * Glyphs match the Evidence Rail's, so the same state reads the same way on
 * the home page and in a saved report.
 */
export type VerdictValue = "FAIL" | "REVIEW" | "CLEAR" | "INCONCLUSIVE";

/** Hex, not CSS variables: these also feed SVG presentation attributes (the page overlay), which don't resolve var(). Kept identical to --pm-fail / --pm-review / --pm-clear / --pm-slate. */
export const VERDICT_TONE: Record<VerdictValue, { color: string; fill: string; glyph: string; label: string }> = {
  FAIL: { color: "#b4231f", fill: "rgba(180, 35, 31, 0.10)", glyph: "×", label: "Fail" },
  REVIEW: { color: "#8a6a1f", fill: "rgba(138, 106, 31, 0.12)", glyph: "~", label: "Review" },
  CLEAR: { color: "#1f6b4a", fill: "rgba(31, 107, 74, 0.10)", glyph: "=", label: "Clear" },
  INCONCLUSIVE: { color: "#777b86", fill: "rgba(119, 123, 134, 0.12)", glyph: "?", label: "Inconclusive" },
};

export function VerdictBadge({ verdict, className }: { verdict: VerdictValue; className?: string }) {
  const tone = VERDICT_TONE[verdict];
  return (
    <span className={className ? `pm-verdict ${className}` : "pm-verdict"} data-verdict={verdict}>
      <span aria-hidden="true" className="pm-verdict-glyph">
        {tone.glyph}
      </span>
      {verdict}
    </span>
  );
}

/** Non-verdict row states. Achromatic on purpose — a processing failure is not a FAIL verdict and must not borrow its red. */
export function StatusBadge({ status }: { status: Exclude<DocumentStatus, "ready"> }) {
  return (
    <span className="pm-status" data-status={status}>
      {status === "processing" ? "PROCESSING" : "ERROR"}
    </span>
  );
}

const KIND_LABEL: Record<string, string> = {
  bank_statement: "Bank statement",
  invoice: "Invoice",
  receipt: "Receipt",
  salary_slip: "Salary slip",
  payment_proof: "Payment proof",
  generic: "General document",
};

export function documentKindLabel(kind: string | null | undefined): string {
  if (!kind) return "General document";
  return KIND_LABEL[kind] ?? kind.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatDay(iso: string): string {
  return DAY.format(new Date(iso));
}

export function formatDayTime(iso: string): string {
  const d = new Date(iso);
  return `${DAY.format(d)}, ${TIME.format(d)}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
