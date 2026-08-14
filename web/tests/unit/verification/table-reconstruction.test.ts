import { describe, expect, it } from "vitest";
import { assignRowToColumns, cellCoordinate, detectColumns, groupRowsByY, parseAmount, type ColumnSpec } from "@/lib/verification/table-reconstruction";
import type { RawExtraction, TextItem } from "@/lib/pdf/extract";

function item(overrides: Partial<TextItem> & Pick<TextItem, "text" | "x" | "y" | "page">): TextItem {
  return {
    width: 30,
    height: 10,
    font: "Helvetica",
    fontSize: 9,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikeout: false,
    itemType: "Text" as TextItem["itemType"],
    ...overrides,
  };
}

describe("parseAmount", () => {
  it("parses a plain decimal", () => {
    expect(parseAmount("1234.56")).toBe(1234.56);
  });
  it("strips currency symbols and thousands separators", () => {
    expect(parseAmount("₹12,345.00")).toBe(12345);
    expect(parseAmount("$1,000.50")).toBe(1000.5);
  });
  it("treats parenthesized values as negative (accounting notation)", () => {
    expect(parseAmount("(500.00)")).toBe(-500);
  });
  it("returns null for blank/dash cells, never coercing to 0", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("  ")).toBeNull();
    expect(parseAmount("-")).toBeNull();
  });
  it("returns null for non-numeric text", () => {
    expect(parseAmount("R1C2")).toBeNull();
    expect(parseAmount("N/A")).toBeNull();
  });
});

describe("groupRowsByY", () => {
  it("groups items within tolerance into one row, sorted left to right", () => {
    const items = [item({ text: "B", x: 100, y: 500, page: 1 }), item({ text: "A", x: 10, y: 501, page: 1 }), item({ text: "C", x: 200, y: 499, page: 1 })];
    const rows = groupRowsByY(items, 1, 3);
    expect(rows).toHaveLength(1);
    expect(rows[0].items.map((i) => i.text)).toEqual(["A", "B", "C"]);
  });

  it("separates items outside the y-tolerance into distinct rows, top to bottom", () => {
    const items = [item({ text: "row2", x: 10, y: 400, page: 1 }), item({ text: "row1", x: 10, y: 500, page: 1 })];
    const rows = groupRowsByY(items, 1, 3);
    expect(rows.map((r) => r.items[0].text)).toEqual(["row1", "row2"]);
  });

  it("ignores items from other pages", () => {
    const items = [item({ text: "p1", x: 10, y: 500, page: 1 }), item({ text: "p2", x: 10, y: 500, page: 2 })];
    expect(groupRowsByY(items, 1).flatMap((r) => r.items.map((i) => i.text))).toEqual(["p1"]);
  });

  it("skips empty/whitespace-only text items", () => {
    const items = [item({ text: "  ", x: 10, y: 500, page: 1 }), item({ text: "real", x: 50, y: 500, page: 1 })];
    expect(groupRowsByY(items, 1).flatMap((r) => r.items.map((i) => i.text))).toEqual(["real"]);
  });
});

describe("detectColumns / assignRowToColumns", () => {
  const specs: ColumnSpec[] = [
    { name: "date", pattern: /^date$/i },
    { name: "debit", pattern: /^debit$/i },
    { name: "credit", pattern: /^credit$/i },
    { name: "balance", pattern: /^balance$/i },
  ];

  it("detects columns by matching header text against each pattern", () => {
    const header = groupRowsByY([item({ text: "Date", x: 0, y: 0, page: 1 }), item({ text: "Balance", x: 300, y: 0, page: 1 })], 1)[0];
    const cols = detectColumns(header, specs);
    expect(cols.map((c) => c.name).sort()).toEqual(["balance", "date"]);
  });

  it("assigns each data-row item to its nearest detected column by x-distance", () => {
    const header = groupRowsByY(
      [item({ text: "Date", x: 0, y: 100, page: 1 }), item({ text: "Debit", x: 200, y: 100, page: 1 }), item({ text: "Balance", x: 400, y: 100, page: 1 })],
      1,
    )[0];
    const cols = detectColumns(header, specs);
    const dataRow = groupRowsByY([item({ text: "01 Apr", x: 2, y: 50, page: 1 }), item({ text: "9500.00", x: 402, y: 50, page: 1 })], 1)[0];
    const assignment = assignRowToColumns(dataRow, cols);
    expect(assignment.get("date")?.text).toBe("01 Apr");
    expect(assignment.get("balance")?.text).toBe("9500.00");
    expect(assignment.has("debit")).toBe(false);
  });

  it("does not force-assign a stray item far from every known column", () => {
    const header = groupRowsByY([item({ text: "Date", x: 0, y: 100, page: 1 })], 1)[0];
    const cols = detectColumns(header, specs);
    const footer = groupRowsByY([item({ text: "Page 1 of 1", x: 500, y: 10, page: 1 })], 1)[0];
    expect(assignRowToColumns(footer, cols).size).toBe(0);
  });
});

describe("cellCoordinate", () => {
  it("flips the item's native y using the document's real page size", () => {
    const raw: RawExtraction = {
      markdown: { pages: [], pagesWithTables: [], pagesWithColumns: [], pagesNeedingOcr: [], ocrReasonsByPage: [], isComplex: false },
      meta: {
        pdfType: "TextBased" as RawExtraction["meta"]["pdfType"],
        pageCount: 1,
        processingTimeMs: 1,
        pagesNeedingOcr: [],
        ocrReasonsByPage: [],
        confidence: 1,
        isComplexLayout: false,
        pagesWithTables: [],
        pagesWithColumns: [],
        hasEncodingIssues: false,
      },
      textItems: [],
      structureElements: [],
      pageSizes: new Map([[1, { widthPt: 612, heightPt: 792 }]]),
    };
    const cell = item({ text: "9500.00", x: 400, y: 600, width: 40, height: 10, page: 1 });
    const coord = cellCoordinate(raw, 1, cell);
    expect(coord.page).toBe(1);
    expect(coord.rect).toEqual({ x: 400, y: 792 - (600 + 10), w: 40, h: 10 });
  });
});
