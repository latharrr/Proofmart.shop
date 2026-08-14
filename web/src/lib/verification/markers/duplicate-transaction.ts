import "server-only";

import { assignRowToColumns, cellCoordinate, detectColumns, groupRowsByY, parseAmount, type ColumnSpec } from "../table-reconstruction";
import type { Coordinate, Marker, MarkerOutcome, VerificationFinding } from "../types";

const HEADER_PATTERNS: ColumnSpec[] = [
  { name: "date", pattern: /^date$/i },
  { name: "debit", pattern: /^(debit|withdrawal)s?$/i },
  { name: "credit", pattern: /^(credit|deposit)s?$/i },
];

/**
 * DUPLICATE_TRANSACTION
 *
 * Category:          Semantic
 * Required inputs:   A page with a table (`ProcessedPage.hasTable`) whose header row has a Date column and at
 *                     least one of Debit/Credit, plus positioned text for its data rows.
 * Detection logic:   Reconstructs rows/columns from positioned text (same technique as BALANCE_BREAK — see that
 *                     marker for why the markdown table path isn't used). Groups data rows by (date, amount);
 *                     any group with two or more rows sharing an identical date and amount is flagged.
 * Severity:          moderate
 * Verdict:           REVIEW — a repeated date+amount is worth a second look, not proof of an error. Legitimate
 *                     documents can have genuine same-day, same-amount transactions (e.g. two identical
 *                     subscription charges).
 * Evidence:          The date and amount cells of every row in the duplicate group, with real coordinates.
 * Coordinates:        One coordinate per matched cell (date + amount) for every row in the group.
 * Limitations:
 *   - Matches on (date, amount) only — does not consider description text, so two unrelated transactions that
 *     happen to share a date and amount are indistinguishable from a true duplicate.
 *   - Same column-header and alignment assumptions as BALANCE_BREAK.
 * False positives:
 *   - Recurring same-day, same-amount transactions (subscriptions, scheduled transfers, split payments) are
 *     legitimate and will still be flagged — the marker surfaces them for review, not as confirmed errors.
 */
export const duplicateTransactionMarker: Marker = {
  id: "DUPLICATE_TRANSACTION",
  name: "Duplicate transaction",
  category: "Semantic",
  description: "Flags rows in a reconstructed ledger table sharing an identical date and amount.",
  requiredInputs: ["ProcessedPage.hasTable", "positioned text with Date + Debit/Credit headers"],
  limitations: [
    "Matches on (date, amount) only — description text is not considered.",
    "Same column-alignment assumptions as BALANCE_BREAK.",
  ],
  falsePositiveConsiderations: [
    "Legitimate recurring same-day, same-amount transactions (subscriptions, split payments) will still be flagged for review.",
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
        const names = new Set(detectColumns(r, HEADER_PATTERNS).map((c) => c.name));
        return names.has("date") && (names.has("debit") || names.has("credit"));
      });
      if (headerRowIndex === -1) continue;
      anyPageUsable = true;

      const columns = detectColumns(rows[headerRowIndex], HEADER_PATTERNS);
      const groups = new Map<string, { coords: Coordinate[]; dateText: string; amount: number }[]>();

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const assignment = assignRowToColumns(rows[i], columns);
        const dateItem = assignment.get("date");
        const amountItem = assignment.get("debit") ?? assignment.get("credit");
        if (!dateItem || !amountItem) continue;
        const amount = parseAmount(amountItem.text);
        if (amount === null) continue;

        const dateText = dateItem.text.trim().toLowerCase();
        const key = `${dateText}|${amount.toFixed(2)}`;
        const entry = { coords: [cellCoordinate(raw, page, dateItem), cellCoordinate(raw, page, amountItem)], dateText: dateItem.text.trim(), amount };
        const existing = groups.get(key);
        if (existing) existing.push(entry);
        else groups.set(key, [entry]);
      }

      let dupIndex = 0;
      for (const [, entries] of groups) {
        if (entries.length < 2) continue;
        dupIndex += 1;
        findings.push({
          id: `finding-duplicate-p${page}-${dupIndex}`,
          markerId: "DUPLICATE_TRANSACTION",
          markerName: "Duplicate transaction",
          category: "Semantic",
          severity: "moderate",
          verdict: "REVIEW",
          evidence: {
            summary: `${entries.length} transactions share date ${entries[0].dateText} and amount ${entries[0].amount.toFixed(2)}`,
            detail: `Matched on identical date + amount across ${entries.length} rows — description was not compared.`,
            coordinates: entries.flatMap((e) => e.coords),
          },
        });
      }
    }

    if (!anyPageUsable) {
      return { status: "insufficient-data", reason: "No table with recognizable Date + Debit/Credit columns was found." };
    }
    return { status: "applicable", findings };
  },
};
