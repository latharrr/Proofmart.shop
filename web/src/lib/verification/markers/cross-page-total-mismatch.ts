import "server-only";

import {
  assignRowToColumns,
  cellCoordinate,
  detectColumns,
  groupRowsByY,
  parseAmount,
  type ColumnSpec,
  type ReconstructedRow,
} from "../table-reconstruction";
import type { Coordinate, Marker, MarkerOutcome, VerificationFinding } from "../types";
import type { TextItem } from "@/lib/pdf/extract";

const TOLERANCE = 0.01;

const HEADER_PATTERNS: ColumnSpec[] = [
  { name: "debit", pattern: /^(debit|withdrawal)s?$/i },
  { name: "credit", pattern: /^(credit|deposit)s?$/i },
  { name: "balance", pattern: /^balance$/i },
];

interface PageLedger {
  page: number;
  rows: { item: TextItem; balance: number; debit: number; credit: number }[];
}

function buildPageLedger(rows: ReconstructedRow[], page: number): PageLedger | null {
  const headerRowIndex = rows.findIndex((r) => {
    const names = new Set(detectColumns(r, HEADER_PATTERNS).map((c) => c.name));
    return names.has("balance") && names.has("debit") && names.has("credit");
  });
  if (headerRowIndex === -1) return null;

  const columns = detectColumns(rows[headerRowIndex], HEADER_PATTERNS);
  const ledgerRows: PageLedger["rows"] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const assignment = assignRowToColumns(rows[i], columns);
    const balanceItem = assignment.get("balance");
    if (!balanceItem) continue;
    const balance = parseAmount(balanceItem.text);
    if (balance === null) continue;
    const debit = parseAmount(assignment.get("debit")?.text ?? "") ?? 0;
    const credit = parseAmount(assignment.get("credit")?.text ?? "") ?? 0;
    ledgerRows.push({ item: balanceItem, balance, debit, credit });
  }
  if (ledgerRows.length === 0) return null;
  return { page, rows: ledgerRows };
}

/**
 * CROSS_PAGE_TOTAL_MISMATCH
 *
 * Category:          Arithmetic
 * Required inputs:   At least two consecutive pages (page N and N+1) each with positioned text forming a
 *                     recognizable Debit/Credit/Balance header row and at least one data row with a parseable
 *                     balance.
 * Detection logic:   Same reconstruction technique as BALANCE_BREAK. For each pair of consecutive pages, checks
 *                     that the last balance row on page N carries forward into the first balance row on page
 *                     N+1: balance[first row of N+1] ≈ balance[last row of N] + credit[first row of N+1] −
 *                     debit[first row of N+1], within a 0.01 tolerance.
 * Severity:          critical
 * Verdict:           FAIL — the document's own numbers don't carry forward across the page break.
 * Evidence:          The last balance cell on page N and the first balance (and debit/credit, if present) cell
 *                     on page N+1, with real coordinates.
 * Coordinates:        Both boundary rows' Balance cells, plus whichever of Debit/Credit the boundary row on
 *                     page N+1 carried.
 * Limitations:
 *   - Only checks pages that are numerically adjacent (N, N+1) — a table split across non-adjacent pages (e.g.
 *     an intervening page of prose) is not checked.
 *   - Same column-header and x-alignment assumptions as BALANCE_BREAK; does not run on a single combined
 *     Amount column.
 * False positives:
 *   - A PDF that concatenates two genuinely separate statements/accounts back-to-back (not a real continuation)
 *     will be flagged as if it were one broken ledger — this marker cannot distinguish that case from a real
 *     carry-forward break.
 */
export const crossPageTotalMismatchMarker: Marker = {
  id: "CROSS_PAGE_TOTAL_MISMATCH",
  name: "Cross-page total mismatch",
  category: "Arithmetic",
  description: "Checks that a ledger table's running balance carries forward correctly across a page break.",
  requiredInputs: ["Two consecutive pages, each with a Debit/Credit/Balance table"],
  limitations: [
    "Only checks numerically adjacent page pairs (N, N+1); a table split by an intervening non-table page is not checked.",
    "Same column-header and x-alignment assumptions as BALANCE_BREAK.",
  ],
  falsePositiveConsiderations: [
    "Two genuinely separate statements/accounts concatenated into one PDF will be flagged as a broken continuation, since this marker can't distinguish that from a real carry-forward break.",
  ],

  run(ctx): MarkerOutcome {
    const { raw } = ctx;
    if (ctx.document.pages.length < 2) {
      return { status: "insufficient-data", reason: "Document has fewer than two pages." };
    }

    // Scans every page for a real Debit/Credit/Balance header row rather than
    // pre-filtering on `ProcessedPage.hasTable` (as BALANCE_BREAK does) —
    // pdf-inspector's own table heuristic can miss a short 1-2 row
    // continuation section at the top of a page, which is exactly the case
    // this marker cares most about. The header-detection logic below is
    // itself the real gate.
    const ledgers = new Map<number, PageLedger>();
    for (const p of ctx.document.pages) {
      const rows = groupRowsByY(raw.textItems, p.page);
      const ledger = buildPageLedger(rows, p.page);
      if (ledger) ledgers.set(p.page, ledger);
    }

    const boundaryPages = [...ledgers.keys()].filter((p) => ledgers.has(p + 1)).sort((a, b) => a - b);
    if (boundaryPages.length === 0) {
      return { status: "insufficient-data", reason: "No two consecutive pages both had a recognizable Debit/Credit/Balance table." };
    }

    const findings: VerificationFinding[] = [];
    for (const page of boundaryPages) {
      const current = ledgers.get(page)!;
      const next = ledgers.get(page + 1)!;
      const lastRow = current.rows[current.rows.length - 1];
      const firstRow = next.rows[0];

      const expected = lastRow.balance + firstRow.credit - firstRow.debit;
      const delta = firstRow.balance - expected;
      if (Math.abs(delta) > TOLERANCE) {
        const coords: Coordinate[] = [
          cellCoordinate(raw, current.page, lastRow.item),
          cellCoordinate(raw, next.page, firstRow.item),
        ];
        findings.push({
          id: `finding-cross-page-total-p${page}-p${page + 1}`,
          markerId: "CROSS_PAGE_TOTAL_MISMATCH",
          markerName: "Cross-page total mismatch",
          category: "Arithmetic",
          severity: "critical",
          verdict: "FAIL",
          evidence: {
            summary: `Balance carried from page ${page} to page ${page + 1} differs by ${formatDelta(delta)}`,
            detail: `page ${page} closing balance ${formatAmount(lastRow.balance)} + ${formatAmount(firstRow.credit)} − ${formatAmount(firstRow.debit)} = ${formatAmount(expected)}\npage ${page + 1} opening row shows  ${formatAmount(firstRow.balance)}`,
            coordinates: coords,
          },
        });
      }
    }

    return { status: "applicable", findings };
  },
};

function formatAmount(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDelta(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${formatAmount(Math.abs(n))}`;
}
