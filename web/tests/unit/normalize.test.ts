import { describe, expect, it } from "vitest";
import { normalizeDocument, toRailRect, union } from "@/lib/pdf/normalize";
import type { PdfClassification } from "@/lib/pdf/types";
import type { RawExtraction, TextItem } from "@/lib/pdf/extract";

type TestTextItem = Omit<TextItem, "itemType"> & { itemType: TextItem["itemType"] | "Text" | "Link" | "Image" | "FormField" };
function textItem(overrides: Partial<TestTextItem> & Pick<TestTextItem, "text" | "x" | "y" | "width" | "height" | "page" | "itemType">): TextItem {
  return {
    font: "Helvetica",
    fontSize: 12,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikeout: false,
    ...overrides,
    itemType: overrides.itemType as TextItem["itemType"],
  };
}

describe("toRailRect", () => {
  it("flips native bottom-left-origin y into top-left-origin, leaving x/w/h alone", () => {
    // pdf-inspector's positioned text/link coordinates are native PDF space
    // (origin bottom-left, y up) — confirmed empirically against pdf-lib's
    // own drawing coordinates. A run at native y=700 height=18 on a
    // 792pt-tall page has its top edge 792-718=74pt from the page's top.
    expect(toRailRect(10, 700, 30, 18, 792)).toEqual({ x: 10, y: 74, w: 30, h: 18 });
  });

  it("a rect flush with the page bottom maps to the page's bottom edge", () => {
    expect(toRailRect(0, 0, 50, 20, 792)).toEqual({ x: 0, y: 772, w: 50, h: 20 });
  });

  it("a rect flush with the page top maps to y=0", () => {
    expect(toRailRect(0, 772, 50, 20, 792)).toEqual({ x: 0, y: 0, w: 50, h: 20 });
  });
});

describe("union", () => {
  it("computes the bounding box of two rects", () => {
    const a = { x: 10, y: 10, w: 20, h: 5 };
    const b = { x: 25, y: 8, w: 10, h: 10 };
    expect(union(a, b)).toEqual({ x: 10, y: 8, w: 25, h: 10 });
  });

  it("is a no-op when the second rect is contained in the first", () => {
    const a = { x: 0, y: 0, w: 100, h: 100 };
    const b = { x: 10, y: 10, w: 5, h: 5 };
    expect(union(a, b)).toEqual(a);
  });
});

const classification: PdfClassification = {
  pdfType: "TextBased",
  pageCount: 2,
  pagesNeedingOcr: [],
  confidence: 0.92,
};

function baseRaw(overrides: Partial<RawExtraction> = {}): RawExtraction {
  return {
    markdown: {
      pages: [
        { page: 0, markdown: "# Title", needsOcr: false },
        { page: 1, markdown: "body", needsOcr: false },
      ],
      pagesWithTables: [],
      pagesWithColumns: [],
      pagesNeedingOcr: [],
      ocrReasonsByPage: [],
      isComplex: false,
    },
    meta: {
      pdfType: "TextBased" as RawExtraction["meta"]["pdfType"],
      pageCount: 2,
      processingTimeMs: 12,
      pagesNeedingOcr: [],
      ocrReasonsByPage: [],
      confidence: 0.92,
      isComplexLayout: false,
      pagesWithTables: [],
      pagesWithColumns: [],
      hasEncodingIssues: false,
    },
    textItems: [],
    structureElements: [],
    pageSizes: new Map([
      [1, { widthPt: 612, heightPt: 792 }],
      [2, { widthPt: 612, heightPt: 792 }],
    ]),
    ...overrides,
  };
}

describe("normalizeDocument", () => {
  it("converts 0-indexed page markdown into 1-indexed ProcessedPage entries", () => {
    const doc = normalizeDocument(baseRaw(), classification, { filename: "a.pdf", sizeBytes: 100 });
    expect(doc.pages.map((p) => p.page)).toEqual([1, 2]);
  });

  it("always emits a document-level classification fact", () => {
    const doc = normalizeDocument(baseRaw(), classification, { filename: "a.pdf", sizeBytes: 100 });
    const fact = doc.facts.find((f) => f.kind === "classification");
    expect(fact).toBeDefined();
    expect(fact?.rect).toBeNull();
    expect(fact?.page).toBe(1);
  });

  it("emits one OCR-needed fact per flagged page with its reason", () => {
    const raw = baseRaw({
      markdown: {
        ...baseRaw().markdown,
        pagesNeedingOcr: [2],
        ocrReasonsByPage: [{ page: 2, reasons: ["low_confidence"] }],
      },
    });
    const doc = normalizeDocument(raw, classification, { filename: "a.pdf", sizeBytes: 100 });
    const fact = doc.facts.find((f) => f.kind === "ocr-needed");
    expect(fact?.page).toBe(2);
    expect(fact?.detail).toContain("low_confidence");
  });

  it("groups multi-run headings into one fact with a merged bounding rect", () => {
    const raw = baseRaw({
      structureElements: [{ page: 1, mcid: 0, role: "H1" }],
      textItems: [
        textItem({ text: "Quarterly ", x: 72, y: 700, width: 80, height: 18, page: 1, itemType: "Text", mcid: 0 }),
        textItem({ text: "Report", x: 152, y: 700, width: 50, height: 18, page: 1, itemType: "Text", mcid: 0 }),
      ],
    });
    const doc = normalizeDocument(raw, classification, { filename: "a.pdf", sizeBytes: 100 });
    const headingFacts = doc.facts.filter((f) => f.kind === "heading");
    expect(headingFacts).toHaveLength(1);
    expect(headingFacts[0].detail).toBe("Quarterly Report");
    // Merged rect spans both runs (x: first run's start to second run's
    // end); y is flipped from the native y=700 both runs share, on a
    // 792pt-tall page: 792-(700+18)=74.
    expect(headingFacts[0].rect).toEqual({ x: 72, y: 74, w: 130, h: 18 });
  });

  it("extracts link facts with their real coordinates and URL", () => {
    const raw = baseRaw({
      textItems: [textItem({ text: "example.com", x: 72, y: 600, width: 90, height: 12, page: 1, itemType: "Link", linkUrl: "https://example.com" })],
    });
    const doc = normalizeDocument(raw, classification, { filename: "a.pdf", sizeBytes: 100 });
    const link = doc.facts.find((f) => f.kind === "link");
    expect(link?.detail).toBe("https://example.com");
    // Native y=600 height=12 on a 792pt page flips to 792-(600+12)=180.
    expect(link?.rect).toEqual({ x: 72, y: 180, w: 90, h: 12 });
  });

  it("never fabricates a table fact for a page pdf-inspector didn't flag", () => {
    const doc = normalizeDocument(baseRaw(), classification, { filename: "a.pdf", sizeBytes: 100 });
    expect(doc.facts.some((f) => f.kind === "table")).toBe(false);
  });
});
