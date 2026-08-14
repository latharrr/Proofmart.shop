/**
 * Pure, client-safe conversion from a `ProcessedDocument`'s extracted facts
 * — and, once verification has run, its real `VerificationFinding`s — into
 * the rail's generic `RailFinding` shape. No native/server imports — this
 * is what the rail itself calls while rendering.
 */
import type { VerificationFinding, VerificationResult } from "@/lib/verification/types";
import type { ExtractedFact, ProcessedDocument, RailFinding } from "./types";

export const FACT_LABEL: Record<ExtractedFact["kind"], string> = {
  classification: "TYPE",
  title: "TITLE",
  "encoding-issue": "ENCODING",
  "ocr-needed": "OCR NEEDED",
  table: "TABLE",
  heading: "HEADING",
  link: "LINK",
  "form-field": "FORM FIELD",
};

export function factsForPage(doc: ProcessedDocument, page: number): ExtractedFact[] {
  return doc.facts.filter((f) => f.page === page);
}

export function factToRailFinding(fact: ExtractedFact): RailFinding {
  return {
    id: fact.id,
    verdict: "INCONCLUSIVE",
    marker: FACT_LABEL[fact.kind] ?? fact.kind.toUpperCase(),
    addr1: `p${fact.page}`,
    addr2: fact.rect ? `${Math.round(fact.rect.x)},${Math.round(fact.rect.y)}` : "doc",
    // `detail` carries the substantive content (a URL, a heading's text, an
    // OCR reason); `label` is the generic category name and is redundant
    // with `marker` here, so it isn't repeated.
    explanation: fact.detail,
    arithmetic: null,
    rect: fact.rect,
    origin: "extracted-fact",
  };
}

/** Verification findings can carry more than one coordinate (e.g. BALANCE_BREAK cites both the broken row and the prior row); the rail highlights one region per finding, so the first coordinate — the marker's most salient one, by convention — becomes the primary rect, matching the sample's own convention of pointing at the offending value, not every related cell. */
export function verificationFindingToRailFinding(finding: VerificationFinding): RailFinding {
  const primary = finding.evidence.coordinates.find((c) => c.rect) ?? finding.evidence.coordinates[0] ?? null;
  return {
    id: finding.id,
    verdict: finding.verdict,
    marker: finding.markerId,
    addr1: primary ? `p${primary.page}` : "doc",
    addr2: primary?.rect ? `${Math.round(primary.rect.x)},${Math.round(primary.rect.y)}` : "doc",
    explanation: finding.evidence.summary,
    arithmetic: finding.evidence.detail,
    rect: primary?.rect ?? null,
    origin: "verification-finding",
  };
}

function verificationFindingPage(finding: VerificationFinding): number {
  return finding.evidence.coordinates[0]?.page ?? 1;
}

const SEVERITY_RANK: Record<VerificationFinding["verdict"], number> = { FAIL: 0, REVIEW: 1, INCONCLUSIVE: 2 };

/**
 * Everything the rail shows for one page of a live document: real
 * verification findings first (most severe first — this is the headline
 * result), then extracted facts as supporting context. Each row carries its
 * own `verdict`/`origin`, so the two are visually distinguishable by their
 * badge color/glyph even though they render in one list, matching the
 * sample's existing single-list convention rather than adding new UI.
 */
export function railFindingsForPage(document: ProcessedDocument, verification: VerificationResult | null, page: number): RailFinding[] {
  const verificationRail = (verification?.findings ?? [])
    .filter((f) => verificationFindingPage(f) === page)
    .sort((a, b) => SEVERITY_RANK[a.verdict] - SEVERITY_RANK[b.verdict])
    .map(verificationFindingToRailFinding);
  const factRail = factsForPage(document, page).map(factToRailFinding);
  return [...verificationRail, ...factRail];
}

/** Default pin target for a page: prefer a finding with real coordinates (something the overlay can actually draw) over a document-level one. */
export function firstPinnable(findings: RailFinding[]): RailFinding | null {
  return findings.find((f) => f.rect) ?? findings[0] ?? null;
}

export interface VerdictCounts {
  fail: number;
  review: number;
  clear: number;
}

/** Real counts for the rail header's FAIL/REVIEW/CLEAR chips — "clear" means markers that actually ran and found nothing, not just "zero, decoratively" the way the bundled sample's chip is. */
export function verdictCounts(result: VerificationResult): VerdictCounts {
  const fail = result.findings.filter((f) => f.verdict === "FAIL").length;
  const review = result.findings.filter((f) => f.verdict === "REVIEW" || f.verdict === "INCONCLUSIVE").length;
  const markersWithFindings = new Set(result.findings.map((f) => f.markerId));
  const clear = result.markersRun.filter((id) => !markersWithFindings.has(id)).length;
  return { fail, review, clear };
}

export interface SummaryChip {
  label: string;
  value: number;
}

/** Top fact kinds across the whole document, most common first — feeds the same three-chip slot the sample's FAIL/REVIEW/CLEAR counts use. */
export function summaryChips(doc: ProcessedDocument): SummaryChip[] {
  const counts = new Map<ExtractedFact["kind"], number>();
  for (const f of doc.facts) counts.set(f.kind, (counts.get(f.kind) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (sorted.length === 0) return [{ label: "FACTS", value: 0 }];
  return sorted.map(([kind, value]) => ({ label: FACT_LABEL[kind] ?? kind.toUpperCase(), value }));
}

/** Clamps a page-navigation step to `[1, totalPages]` — shared by the live-document hook and its tests. */
export function clampPage(current: number, totalPages: number, delta: number): number {
  return Math.min(Math.max(1, totalPages), Math.max(1, current + delta));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
