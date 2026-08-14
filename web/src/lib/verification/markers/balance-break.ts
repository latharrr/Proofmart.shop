import "server-only";

import {
  assignRowToColumns,
  cellCoordinate,
  detectColumns,
  groupRowsByY,
  parseAmount,
  type ColumnSpec,
} from "../table-reconstruction";
import type { Marker, MarkerOutcome, VerificationFinding } from "../types";

const TOLERANCE = 0.01;

const HEADER_PATTERNS: ColumnSpec[] = [
  { name: "date", pattern: /^date$/i },
  { name: "description", pattern: /^(description|narration|particulars)$/i },
  { name: "debit", pattern: /^(debit|withdrawal)s?$/i },
  { name: "credit", pattern: /^(credit|deposit)s?$/i },
  { name: "balance", pattern: /^balance$/i },
];

/**
 * BALANCE_BREAK
 *
 * Category:          Arithmetic
 * Required inputs:   A page with a table (`ProcessedPage.hasTable`) whose header row has *both* Debit and Credit
 *                     columns (by exact header text — see limitations) plus a Balance column, and positioned text
 *                     for its data rows.
 * Detection logic:   Reconstructs rows/columns directly from real positioned text (not pdf-inspector's markdown
 *                     table formatting — that path was found to drop empty cells and misdetect headers as headings
 *                     during development, so it isn't trustworthy evidence). For each row after the first,
 *                     checks balance[i] ≈ balance[i-1] + credit[i] - debit[i], within a 0.01 tolerance.
 * Severity:          critical
 * Verdict:           FAIL — a real, structurally-detected arithmetic inconsistency in the document's own numbers.
 * Evidence:          The specific rows' Balance/Debit/Credit cells, with real coordinates on the page.
 * Coordinates:        The current row's Balance cell, the prior row's Balance cell, and whichever of Debit/Credit
 *                     carried a value — all real, located by exact text match against positioned text items.
 * Limitations:
 *   - Column headers are matched by exact keyword ("Date", "Debit", "Credit", "Balance", or common synonyms) —
 *     tables using different column names won't be recognized.
 *   - Assumes columns are vertically aligned by x-position (typical of tabular statements); ragged or
 *     non-grid-aligned layouts can misassign cells to the wrong column.
 *   - A row with neither a Debit nor a Credit value (e.g. an opening-balance row) is used only to seed the
 *     running balance, never itself checked or flagged.
 *   - Does not run on documents with a single combined "Amount" column instead of separate Debit/Credit —
 *     the sign of a single amount value can't be inferred reliably enough to avoid false positives.
 * False positives:
 *   - A table that merely LOOKS like a ledger (same header words, unrelated numbers) would be checked the same
 *     way — this marker verifies internal arithmetic consistency, not that the table is actually a bank statement.
 *   - Multi-currency statements mixing symbols on the same page could parse incorrectly if amounts aren't
 *     annotated with a recognizable format.
 */
export const balanceBreakMarker: Marker = {
  id: "BALANCE_BREAK",
  name: "Balance break",
  category: "Arithmetic",
  description: "Checks running-balance continuity (balance = prior balance + credit − debit) in a reconstructed ledger table.",
  requiredInputs: ["ProcessedPage.hasTable", "positioned text with Date/Debit/Credit/Balance headers"],
  limitations: [
    "Column headers must match a known keyword (Date, Debit/Withdrawal, Credit/Deposit, Balance) — unrecognized header text means the table is skipped.",
    "Assumes vertically-aligned columns by x-position; ragged layouts can misassign cells.",
    "Does not run against a single combined Amount column — sign can't be inferred reliably.",
  ],
  falsePositiveConsiderations: [
    "Verifies internal arithmetic only — a table with the right headers but unrelated numbers is checked the same way as a real ledger.",
    "Mixed-currency amounts on one page could parse incorrectly.",
  ],

  run(ctx): MarkerOutcome {
    const { raw } = ctx;
    const tablePages = ctx.document.pages.filter((p) => p.hasTable).map((p) => p.page);
    if (tablePages.length === 0) {
      return { status: "insufficient-data", reason: "No table detected in this document." };
    }

    const findings: VerificationFinding[] = [];
    let anyPageUsable = false;

    for (const page of tablePages) {
      const rows = groupRowsByY(raw.textItems, page);
      const headerRowIndex = rows.findIndex((r) => {
        const cols = detectColumns(r, HEADER_PATTERNS);
        const names = new Set(cols.map((c) => c.name));
        return names.has("balance") && names.has("debit") && names.has("credit");
      });
      if (headerRowIndex === -1) continue;
      anyPageUsable = true;

      const columns = detectColumns(rows[headerRowIndex], HEADER_PATTERNS);
      let prevBalance: number | null = null;
      let prevBalanceItem = null;

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const assignment = assignRowToColumns(rows[i], columns);
        const balanceItem = assignment.get("balance");
        if (!balanceItem) continue;
        const balance = parseAmount(balanceItem.text);
        if (balance === null) continue;

        if (prevBalance !== null && prevBalanceItem) {
          const debitItem = assignment.get("debit");
          const creditItem = assignment.get("credit");
          const debit = debitItem ? (parseAmount(debitItem.text) ?? 0) : 0;
          const credit = creditItem ? (parseAmount(creditItem.text) ?? 0) : 0;
          const expected = prevBalance + credit - debit;
          const delta = balance - expected;

          if (Math.abs(delta) > TOLERANCE) {
            const coords = [cellCoordinate(raw, page, balanceItem), cellCoordinate(raw, page, prevBalanceItem)];
            const movementItem = creditItem ?? debitItem;
            if (movementItem) coords.push(cellCoordinate(raw, page, movementItem));

            findings.push({
              id: `finding-balance-break-p${page}-r${i}`,
              markerId: "BALANCE_BREAK",
              markerName: "Balance break",
              category: "Arithmetic",
              severity: "critical",
              verdict: "FAIL",
              evidence: {
                summary: `Running balance differs from prior + credit − debit by ${formatDelta(delta)}`,
                detail: `${formatAmount(prevBalance)} + ${formatAmount(credit)} − ${formatAmount(debit)} = ${formatAmount(expected)}\ndocument shows           ${formatAmount(balance)}`,
                coordinates: coords,
              },
            });
          }
        }

        prevBalance = balance;
        prevBalanceItem = balanceItem;
      }
    }

    if (!anyPageUsable) {
      return { status: "insufficient-data", reason: "No table with recognizable Date/Debit/Credit/Balance columns was found." };
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
