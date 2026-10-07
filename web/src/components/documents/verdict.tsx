import type { DocumentStatus } from "@/lib/documents";

/**
 * Verdict display for the workspace. Colours are the three verdict tokens and
 * nothing else; INCONCLUSIVE is not a verdict colour, so it stays achromatic.
 * Glyphs match the Evidence Rail's, so the same state reads the same way on
 * the home page and in a saved report.
 */
export type VerdictValue = "FAIL" | "REVIEW" | "CLEAR" | "INCONCLUSIVE";

/** Hex, not CSS variables: these also feed SVG presentation attributes (the page overlay), which don't resolve var(). Kept identical to --fail / --review / --clear / --mute (design-system.md §2). */
export const VERDICT_TONE: Record<VerdictValue, { color: string; fill: string; glyph: string; label: string }> = {
  FAIL: { color: "#e5342b", fill: "rgba(229, 52, 43, 0.12)", glyph: "×", label: "Fail" },
  REVIEW: { color: "#c98a12", fill: "rgba(201, 138, 18, 0.14)", glyph: "~", label: "Review" },
  CLEAR: { color: "#1d9a63", fill: "rgba(29, 154, 99, 0.12)", glyph: "=", label: "Clear" },
  INCONCLUSIVE: { color: "#6b6f80", fill: "rgba(107, 111, 128, 0.12)", glyph: "?", label: "Inconclusive" },
};

/** The verdict as a pill: wash fill, verdict-coloured dot and uppercase label. */
export function VerdictBadge({ verdict, className }: { verdict: VerdictValue; className?: string }) {
  return (
    <span className={className ? `pm-verdict ${className}` : "pm-verdict"} data-verdict={verdict}>
      <span aria-hidden="true" className="pm-verdict-dot" />
      {verdict}
    </span>
  );
}

/** Non-verdict row states. Achromatic on purpose — a processing failure is not a FAIL verdict and must not borrow its red. */
export function StatusBadge({ status }: { status: Exclude<DocumentStatus, "ready"> }) {
  return (
    <span className="pm-status" data-status={status}>
      <span aria-hidden="true" className="pm-verdict-dot" />
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

/**
 * A filename with soft break opportunities after `_ - .` — so a long name set
 * in the heading role wraps at its own separators instead of mid-word.
 */
export function BreakableFilename({ name }: { name: string }) {
  const parts = name.split(/(?<=[_\-.])/);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <wbr />}
        </span>
      ))}
    </>
  );
}

/** A filename cut after each `_ - .`, for <LineReveal>: every piece becomes its own masked word, so a long name wraps at its separators and each line still rises on its own. */
export function filenameParts(name: string): string[] {
  return name.split(/(?<=[_\-.])/);
}
