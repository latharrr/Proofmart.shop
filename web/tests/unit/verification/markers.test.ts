import { describe, expect, it } from "vitest";
import { balanceBreakMarker } from "@/lib/verification/markers/balance-break";
import { duplicateTransactionMarker } from "@/lib/verification/markers/duplicate-transaction";
import { encodingAnomalyMarker } from "@/lib/verification/markers/encoding-anomaly";
import { ocrLowConfidenceMarker } from "@/lib/verification/markers/ocr-low-confidence";
import type { MarkerContext } from "@/lib/verification/types";
import type { RawExtraction, TextItem } from "@/lib/pdf/extract";
import type { ProcessedDocument, ProcessedPage } from "@/lib/pdf/types";

function page(overrides: Partial<ProcessedPage> = {}): ProcessedPage {
  return { page: 1, widthPt: 612, heightPt: 792, markdown: "", needsOcr: false, hasTable: false, hasColumns: false, ...overrides };
}

function doc(overrides: Partial<ProcessedDocument> = {}): ProcessedDocument {
  return {
    source: "upload",
    filename: "test.pdf",
    sizeBytes: 100,
    pdfType: "TextBased",
    confidence: 0.9,
    pageCount: 1,
    processingTimeMs: 10,
    title: null,
    hasEncodingIssues: false,
    isComplexLayout: false,
    pages: [page()],
    facts: [],
    ...overrides,
  };
}

function textItem(overrides: Partial<TextItem> & Pick<TextItem, "text" | "x" | "y" | "page">): TextItem {
  return {
    width: 40,
    height: 9,
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

function raw(overrides: Partial<RawExtraction> = {}): RawExtraction {
  return {
    markdown: { pages: [], pagesWithTables: [], pagesWithColumns: [], pagesNeedingOcr: [], ocrReasonsByPage: [], isComplex: false },
    meta: {
      pdfType: "TextBased" as RawExtraction["meta"]["pdfType"],
      pageCount: 1,
      processingTimeMs: 10,
      pagesNeedingOcr: [],
      ocrReasonsByPage: [],
      confidence: 0.9,
      isComplexLayout: false,
      pagesWithTables: [],
      pagesWithColumns: [],
      hasEncodingIssues: false,
    },
    textItems: [],
    structureElements: [],
    pageSizes: new Map([[1, { widthPt: 612, heightPt: 792 }]]),
    ...overrides,
  };
}

function ctx(document: ProcessedDocument, rawExtraction: RawExtraction = raw()): MarkerContext {
  return { document, raw: rawExtraction };
}

describe("OCR_LOW_CONFIDENCE", () => {
  it("positive: flags every page needing OCR with its reason", () => {
    const outcome = ocrLowConfidenceMarker.run(
      ctx(doc({ pages: [page({ page: 1, needsOcr: true, ocrReason: "suspected_garbled_text" })] })),
    );
    expect(outcome.status).toBe("applicable");
    if (outcome.status !== "applicable") return;
    expect(outcome.findings).toHaveLength(1);
    expect(outcome.findings[0].verdict).toBe("REVIEW");
    expect(outcome.findings[0].evidence.detail).toContain("suspected_garbled_text");
  });

  it("negative: no pages need OCR -> applicable, zero findings", () => {
    const outcome = ocrLowConfidenceMarker.run(ctx(doc({ pages: [page({ needsOcr: false })] })));
    expect(outcome).toEqual({ status: "applicable", findings: [] });
  });

  it("insufficient-data: a document with no pages", () => {
    const outcome = ocrLowConfidenceMarker.run(ctx(doc({ pages: [] })));
    expect(outcome.status).toBe("insufficient-data");
  });
});

describe("ENCODING_ANOMALY", () => {
  it("positive: hasEncodingIssues true produces a document-level REVIEW finding with no coordinates", () => {
    const outcome = encodingAnomalyMarker.run(ctx(doc({ hasEncodingIssues: true })));
    expect(outcome.status).toBe("applicable");
    if (outcome.status !== "applicable") return;
    expect(outcome.findings).toHaveLength(1);
    expect(outcome.findings[0].verdict).toBe("REVIEW");
    expect(outcome.findings[0].evidence.coordinates).toEqual([]);
  });

  it("negative: hasEncodingIssues false -> applicable, zero findings", () => {
    const outcome = encodingAnomalyMarker.run(ctx(doc({ hasEncodingIssues: false })));
    expect(outcome).toEqual({ status: "applicable", findings: [] });
  });
});

describe("BALANCE_BREAK", () => {
  const ledgerHeader = [
    textItem({ text: "Date", x: 72, y: 700, page: 1 }),
    textItem({ text: "Debit", x: 340, y: 700, page: 1 }),
    textItem({ text: "Credit", x: 420, y: 700, page: 1 }),
    textItem({ text: "Balance", x: 500, y: 700, page: 1 }),
  ];

  it("insufficient-data: no page has a table", () => {
    const outcome = balanceBreakMarker.run(ctx(doc({ pages: [page({ hasTable: false })] })));
    expect(outcome.status).toBe("insufficient-data");
  });

  it("insufficient-data: a table exists but has no recognizable Balance/Debit/Credit headers", () => {
    const context = ctx(
      doc({ pages: [page({ hasTable: true })] }),
      raw({ textItems: [textItem({ text: "Foo", x: 72, y: 700, page: 1 }), textItem({ text: "Bar", x: 300, y: 700, page: 1 })] }),
    );
    const outcome = balanceBreakMarker.run(context);
    expect(outcome.status).toBe("insufficient-data");
  });

  it("negative: consistent balances -> applicable, zero findings", () => {
    const context = ctx(
      doc({ pages: [page({ hasTable: true })] }),
      raw({
        textItems: [
          ...ledgerHeader,
          textItem({ text: "01 Apr", x: 72, y: 678, page: 1 }),
          textItem({ text: "10000.00", x: 500, y: 678, page: 1 }),
          textItem({ text: "02 Apr", x: 72, y: 656, page: 1 }),
          textItem({ text: "5000.00", x: 420, y: 656, page: 1 }),
          textItem({ text: "15000.00", x: 500, y: 656, page: 1 }),
        ],
      }),
    );
    const outcome = balanceBreakMarker.run(context);
    expect(outcome.status).toBe("applicable");
    if (outcome.status !== "applicable") return;
    expect(outcome.findings).toHaveLength(0);
  });

  it("positive: an inconsistent balance produces a FAIL finding with real, non-null coordinates", () => {
    const context = ctx(
      doc({ pages: [page({ hasTable: true })] }),
      raw({
        textItems: [
          ...ledgerHeader,
          textItem({ text: "01 Apr", x: 72, y: 678, page: 1 }),
          textItem({ text: "10000.00", x: 500, y: 678, page: 1 }),
          textItem({ text: "02 Apr", x: 72, y: 656, page: 1 }),
          textItem({ text: "5000.00", x: 420, y: 656, page: 1 }),
          textItem({ text: "16000.00", x: 500, y: 656, page: 1 }), // should be 15000.00
        ],
      }),
    );
    const outcome = balanceBreakMarker.run(context);
    expect(outcome.status).toBe("applicable");
    if (outcome.status !== "applicable") return;
    expect(outcome.findings).toHaveLength(1);
    const [finding] = outcome.findings;
    expect(finding.verdict).toBe("FAIL");
    expect(finding.severity).toBe("critical");
    expect(finding.evidence.coordinates.length).toBeGreaterThanOrEqual(2);
    for (const c of finding.evidence.coordinates) expect(c.rect).not.toBeNull();
    expect(finding.evidence.detail).toContain("16,000.00");
  });

  it("a row with neither debit nor credit only seeds the running balance and is never itself flagged", () => {
    const context = ctx(
      doc({ pages: [page({ hasTable: true })] }),
      raw({
        textItems: [
          ...ledgerHeader,
          textItem({ text: "01 Apr", x: 72, y: 678, page: 1 }), // opening balance row, no movement
          textItem({ text: "10000.00", x: 500, y: 678, page: 1 }),
          textItem({ text: "02 Apr", x: 72, y: 656, page: 1 }),
          textItem({ text: "5000.00", x: 420, y: 656, page: 1 }),
          textItem({ text: "15000.00", x: 500, y: 656, page: 1 }),
        ],
      }),
    );
    const outcome = balanceBreakMarker.run(context);
    expect(outcome.status).toBe("applicable");
    if (outcome.status !== "applicable") return;
    expect(outcome.findings).toHaveLength(0); // first row seeds, second row is consistent
  });
});

describe("DUPLICATE_TRANSACTION", () => {
  const header = [
    textItem({ text: "Date", x: 72, y: 700, page: 1 }),
    textItem({ text: "Debit", x: 340, y: 700, page: 1 }),
  ];

  it("insufficient-data: no table on any page", () => {
    const outcome = duplicateTransactionMarker.run(ctx(doc({ pages: [page({ hasTable: false })] })));
    expect(outcome.status).toBe("insufficient-data");
  });

  it("negative: all distinct date+amount pairs -> applicable, zero findings", () => {
    const context = ctx(
      doc({ pages: [page({ hasTable: true })] }),
      raw({
        textItems: [
          ...header,
          textItem({ text: "01 Apr", x: 72, y: 678, page: 1 }),
          textItem({ text: "100.00", x: 340, y: 678, page: 1 }),
          textItem({ text: "02 Apr", x: 72, y: 656, page: 1 }),
          textItem({ text: "200.00", x: 340, y: 656, page: 1 }),
        ],
      }),
    );
    const outcome = duplicateTransactionMarker.run(context);
    expect(outcome).toMatchObject({ status: "applicable", findings: [] });
  });

  it("positive: two rows sharing date + amount produce one REVIEW finding citing all matched cells", () => {
    const context = ctx(
      doc({ pages: [page({ hasTable: true })] }),
      raw({
        textItems: [
          ...header,
          textItem({ text: "02 Apr", x: 72, y: 678, page: 1 }),
          textItem({ text: "250.00", x: 340, y: 678, page: 1 }),
          textItem({ text: "02 Apr", x: 72, y: 656, page: 1 }),
          textItem({ text: "250.00", x: 340, y: 656, page: 1 }),
        ],
      }),
    );
    const outcome = duplicateTransactionMarker.run(context);
    expect(outcome.status).toBe("applicable");
    if (outcome.status !== "applicable") return;
    expect(outcome.findings).toHaveLength(1);
    expect(outcome.findings[0].verdict).toBe("REVIEW");
    expect(outcome.findings[0].evidence.coordinates).toHaveLength(4); // date+amount cell for each of 2 rows
  });
});
