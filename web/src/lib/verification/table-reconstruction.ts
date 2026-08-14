import "server-only";

import { FALLBACK_PAGE_SIZE, type RawExtraction, type TextItem } from "@/lib/pdf/extract";
import { textItemRect } from "@/lib/pdf/normalize";
import type { Coordinate } from "./types";

/**
 * Reconstructs table rows/columns directly from pdf-inspector's positioned
 * text items — NOT from `extractPagesMarkdown`'s table formatting, which
 * was empirically found to drop empty cells and misdetect header rows as
 * headings on a synthetic 4-column table during development. Positioned
 * text items, by contrast, come back as one clean, precisely-located item
 * per cell (verified against a hand-built statement fixture: every cell
 * landed at exactly the x/y it was drawn at, nothing merged or dropped).
 *
 * This is a bounded heuristic, not general table extraction: it assumes
 * columns are vertically aligned by x-position, which holds for typical
 * tabular financial statements but not for freeform or ragged layouts.
 */

export interface ReconstructedRow {
  y: number; // native (bottom-left-origin) y of the row band, for internal ordering only
  items: TextItem[]; // left-to-right
}

/** Groups a page's text items into rows by y-proximity, then sorts each row left-to-right by x. Rows are returned top-to-bottom (reading order). */
export function groupRowsByY(items: TextItem[], page: number, yTolerance = 3): ReconstructedRow[] {
  const pageItems = items.filter((i) => i.page === page && i.itemType === "Text" && i.text.trim().length > 0);
  const rows: ReconstructedRow[] = [];
  // Native PDF space: higher y = closer to the top. Sort descending so we walk the page top-to-bottom.
  const sorted = [...pageItems].sort((a, b) => b.y - a.y);
  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r.y - item.y) <= yTolerance);
    if (row) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }
  for (const row of rows) row.items.sort((a, b) => a.x - b.x);
  return rows;
}

export interface ColumnSpec {
  name: string;
  pattern: RegExp;
}

export interface DetectedColumn {
  name: string;
  x: number;
  headerItem: TextItem;
}

/** Finds one header item per column spec within a candidate header row — the row most likely to be the table's header, matched by keyword. */
export function detectColumns(row: ReconstructedRow, specs: ColumnSpec[]): DetectedColumn[] {
  const detected: DetectedColumn[] = [];
  for (const spec of specs) {
    const item = row.items.find((i) => spec.pattern.test(i.text.trim()));
    if (item) detected.push({ name: spec.name, x: item.x, headerItem: item });
  }
  return detected;
}

/** Assigns each item in a data row to its nearest detected column by x-distance. */
export function assignRowToColumns(row: ReconstructedRow, columns: DetectedColumn[]): Map<string, TextItem> {
  const assignment = new Map<string, TextItem>();
  for (const item of row.items) {
    let nearest: DetectedColumn | null = null;
    let nearestDist = Infinity;
    for (const col of columns) {
      const dist = Math.abs(item.x - col.x);
      if (dist < nearestDist) {
        nearest = col;
        nearestDist = dist;
      }
    }
    // Guard against a stray item far from every known column (e.g. a page
    // footer caught in the same y-band) being force-assigned somewhere wrong.
    if (nearest && nearestDist <= 60) assignment.set(nearest.name, item);
  }
  return assignment;
}

/** Parses a currency-formatted cell: strips symbols/commas/whitespace, treats parenthesized values as negative. Empty/unparseable returns null — never coerced to 0, so "blank" stays distinguishable from "zero". */
export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "·") return null;
  const negative = /^\(.*\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[()]/g, "").replace(/[₹$£€,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return negative ? -value : value;
}

export function cellCoordinate(raw: RawExtraction, page: number, item: TextItem): Coordinate {
  const pageHeight = (raw.pageSizes.get(page) ?? FALLBACK_PAGE_SIZE).heightPt;
  return { page, rect: textItemRect(item, pageHeight) };
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parses a statement-style date cell into a comparable numeric key (ms since
 * epoch). Supports the formats real bank/statement tables actually use:
 * `DD Mon[ YYYY]` (e.g. "01 Apr" or "01 Apr 2024"), `YYYY-MM-DD`, and
 * `DD/MM/YYYY`. When no year is present, a fixed synthetic year is used —
 * fine for checking relative (within-document) ordering, meaningless as an
 * absolute date. Unrecognized formats return `null` and are skipped by
 * callers rather than guessed at.
 */
export function parseLedgerDate(raw: string): number | null {
  const trimmed = raw.trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return Date.UTC(Number(y), Number(m) - 1, Number(d));
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    const day = Number(d);
    const month = Number(m);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return Date.UTC(Number(y), month - 1, day);
  }

  const dayMonthMatch = /^(\d{1,2})\s+([A-Za-z]{3,})\.?(?:\s+(\d{4}))?$/.exec(trimmed);
  if (dayMonthMatch) {
    const [, d, monthName, y] = dayMonthMatch;
    const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
    if (month === undefined) return null;
    const day = Number(d);
    if (day < 1 || day > 31) return null;
    return Date.UTC(y ? Number(y) : 2000, month, day);
  }

  return null;
}
