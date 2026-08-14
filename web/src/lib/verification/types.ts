import type { RawExtraction } from "@/lib/pdf/extract";
import type { ProcessedDocument } from "@/lib/pdf/types";

/**
 * The verification domain's own Verdict — intentionally redefined here
 * rather than imported from `lib/pdf` (which has no reason to know about
 * verification concepts). Structurally identical to `RailVerdict` in
 * `lib/pdf/types.ts`; keep both in sync if either changes.
 *
 * Exactly these four states — no others:
 */
export type Verdict = "CLEAR" | "REVIEW" | "FAIL" | "INCONCLUSIVE";

export type MarkerCategory = "Arithmetic" | "Provenance" | "Typography" | "Extraction" | "Semantic";

/** How much weight a finding carries — independent of `Verdict`, which is the finding's own contribution to the aggregate. */
export type Severity = "critical" | "moderate" | "informational";

/** A single real location backing a finding. `rect: null` when the evidence is real but couldn't be anchored to a page position — never fabricated. */
export interface Coordinate {
  /** 1-indexed page. */
  page: number;
  rect: { x: number; y: number; w: number; h: number } | null;
}

export interface Evidence {
  /** One-line human explanation of what was found. */
  summary: string;
  /** The comparison/arithmetic/detail backing the summary — what a reviewer would want to see to check the work themselves. */
  detail: string;
  /** Real locations this finding is anchored to. Empty when the finding is document- or page-level with no specific position. */
  coordinates: Coordinate[];
}

export interface VerificationFinding {
  id: string;
  markerId: string;
  markerName: string;
  category: MarkerCategory;
  severity: Severity;
  /** This finding's own contribution to the aggregate verdict. Never "CLEAR" — a finding only exists when a marker found something to report. */
  verdict: Exclude<Verdict, "CLEAR">;
  evidence: Evidence;
}

export interface VerificationResult {
  verdict: Verdict;
  findings: VerificationFinding[];
  /** Marker ids that had sufficient evidence to run (whether or not they produced a finding). */
  markersRun: string[];
  /** Marker ids that could not run against this document, and why. */
  markersSkipped: { markerId: string; reason: string }[];
}

export interface MarkerContext {
  document: ProcessedDocument;
  /**
   * The raw extraction (positioned text, structure elements, page sizes)
   * behind `document`. Markers that need real coordinates for evidence not
   * already captured as an `ExtractedFact` (e.g. a specific table cell) use
   * this directly, rather than re-deriving it or fabricating a position.
   */
  raw: RawExtraction;
}

export type MarkerOutcome =
  | { status: "applicable"; findings: VerificationFinding[] }
  | { status: "insufficient-data"; reason: string };

/**
 * A marker is a single, narrowly-scoped detector. Metadata
 * (`requiredInputs`/`limitations`/`falsePositiveConsiderations`) is
 * static and describes the technique itself, independent of any one run —
 * it's what lets a reviewer (or a future engineer extending the registry)
 * judge a marker's evidentiary weight without reading its implementation.
 */
export interface Marker {
  id: string;
  name: string;
  category: MarkerCategory;
  description: string;
  requiredInputs: string[];
  limitations: string[];
  falsePositiveConsiderations: string[];
  run(ctx: MarkerContext): MarkerOutcome;
}
