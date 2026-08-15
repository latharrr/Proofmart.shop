import "server-only";

import { assignRowToColumns, cellCoordinate, detectColumns, groupRowsByY, parseLedgerDate, type ColumnSpec } from "../table-reconstruction";
import type { Marker, MarkerOutcome, VerificationFinding } from "../types";

const HEADER_PATTERNS: ColumnSpec[] = [{ name: "date", pattern: /^date$/i }];

/**
 * DATE_SEQUENCE_ANOMALY
 *
 * Category:          Semantic
 * Required inputs:   A page with a table (`ProcessedPage.hasTable`) whose header row has a recognizable Date
 *                     column, and at least two rows with parseable dates.
 * Detection logic:   Reconstructs rows from positioned text (same technique as BALANCE_BREAK). Walks the table's
 *                     Date column in reading order and flags any row whose date is earlier than the row before it
 *                     — statement/ledger tables are conventionally listed in non-decreasing chronological order.
 * Severity:          moderate
 * Verdict:           REVIEW — an out-of-order date is worth a second look, not proof of tampering (a genuine
 *                     correction or reordering can produce the same shape).
 * Evidence:          The out-of-order row's date cell and the preceding row's date cell, with real coordinates.
 * Coordinates:        One coordinate per matched date cell.
 * Limitations:
 *   - Only three date formats are recognized: `DD Mon[ YYYY]`, `YYYY-MM-DD`, `DD/MM/YYYY`. Rows with an
 *     unparseable date are silently skipped, not flagged.
 *   - When no year is present in the cell (e.g. "01 Apr"), a fixed synthetic year is used for comparison — this
 *     only detects ordering *within* the document, not against a real calendar, and a statement spanning a real
 *     year boundary with year-less dates would misorder at the wrap.
 *   - Same column-header and x-alignment assumptions as BALANCE_BREAK.
 * False positives:
 *   - Some statements legitimately group entries by type (all deposits, then all withdrawals) rather than by
 *     strict date — this marker will flag that shape the same as a genuine anomaly.
 */
export const dateSequenceAnomalyMarker: Marker = {
  id: "DATE_SEQUENCE_ANOMALY",
  name: "Date sequence anomaly",
  category: "Semantic",
  description: "Flags rows in a reconstructed ledger table whose date is earlier than the row immediately before it.",
  requiredInputs: ["ProcessedPage.hasTable", "positioned text with a Date header and parseable date cells"],
  limitations: [
    "Recognizes DD Mon[ YYYY], YYYY-MM-DD, and DD/MM/YYYY only — other formats are skipped, not flagged.",
    "Year-less dates (e.g. \"01 Apr\") use a synthetic year for comparison — only relative ordering is checked.",
    "Same column-alignment assumptions as BALANCE_BREAK.",
  ],
  falsePositiveConsiderations: [
    "Statements grouped by transaction type rather than strict date order will be flagged the same as a genuine anomaly.",
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
      const headerRowIndex = rows.findIndex((r) => detectColumns(r, HEADER_PATTERNS).some((c) => c.name === "date"));
      if (headerRowIndex === -1) continue;

      const columns = detectColumns(rows[headerRowIndex], HEADER_PATTERNS);
      let prevDate: number | null = null;
      let prevItem = null;
      let parseableCount = 0;
      let anomalyIndex = 0;

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const assignment = assignRowToColumns(rows[i], columns);
        const dateItem = assignment.get("date");
        if (!dateItem) continue;
        const date = parseLedgerDate(dateItem.text);
        if (date === null) continue;
        parseableCount += 1;

        if (prevDate !== null && prevItem && date < prevDate) {
          anomalyIndex += 1;
          findings.push({
            id: `finding-date-sequence-p${page}-${anomalyIndex}`,
            markerId: "DATE_SEQUENCE_ANOMALY",
            markerName: "Date sequence anomaly",
            category: "Semantic",
            severity: "moderate",
            verdict: "REVIEW",
            evidence: {
              summary: `Row date "${dateItem.text.trim()}" is earlier than the preceding row's date "${prevItem.text.trim()}"`,
              detail: `Expected non-decreasing date order. Row ${i - headerRowIndex} (${dateItem.text.trim()}) comes after row ${i - headerRowIndex - 1} (${prevItem.text.trim()}) but precedes it chronologically.`,
              coordinates: [cellCoordinate(raw, page, dateItem), cellCoordinate(raw, page, prevItem)],
            },
          });
        }

        prevDate = date;
        prevItem = dateItem;
      }

      if (parseableCount >= 2) anyPageUsable = true;
    }

    if (!anyPageUsable) {
      return { status: "insufficient-data", reason: "No table with a recognizable Date column and at least two parseable dates was found." };
    }
    return { status: "applicable", findings };
  },
};
