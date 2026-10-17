import type { DocumentStatus } from "@/lib/documents";
import Tickmark, { VERDICT_TICK } from "@/components/paper/tickmark";

/**
 * Verdict display for the workspace, in the working-paper pencils: red for a
 * break, blue for a query, graphite for a tick; INCONCLUSIVE stays grey.
 * Every verdict carries its tickmark too, matching the Evidence Rail, so the
 * same state reads the same way on the home page and in a saved report.
 */
export type VerdictValue = "FAIL" | "REVIEW" | "CLEAR" | "INCONCLUSIVE";

/** Hex, not CSS variables: these also feed SVG presentation attributes (the page overlay), which don't resolve var(). Kept identical to --red / --blue / --ink / --ink-3 in globals.css. */
export const VERDICT_TONE: Record<VerdictValue, { color: string; fill: string; label: string }> = {
  FAIL: { color: "#bf3020", fill: "rgba(191, 48, 32, 0.10)", label: "Fail" },
  REVIEW: { color: "#1f4f9a", fill: "rgba(31, 79, 154, 0.10)", label: "Review" },
  CLEAR: { color: "#222527", fill: "rgba(34, 37, 39, 0.06)", label: "Clear" },
  INCONCLUSIVE: { color: "#5d635c", fill: "rgba(93, 99, 92, 0.08)", label: "Inconclusive" },
};

/** The verdict as written on the sheet: its tickmark and the word, in its pencil. */
export function VerdictBadge({ verdict, className }: { verdict: VerdictValue; className?: string }) {
  return (
    <span className={className ? `pm-verdict ${className}` : "pm-verdict"} data-verdict={verdict}>
      <Tickmark kind={VERDICT_TICK[verdict]} size={15} />
      {verdict}
    </span>
  );
}

/** Non-verdict row states. Graphite on purpose: a processing failure is not a FAIL verdict and must not borrow its red. */
export function StatusBadge({ status }: { status: Exclude<DocumentStatus, "ready"> }) {
  return (
    <span className="pm-status" data-status={status}>
      <Tickmark kind="none" size={15} />
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
