import { describe, expect, it } from "vitest";
import { clampPage, factsForPage, factToRailFinding, formatBytes, summaryChips } from "@/lib/pdf/rail-adapter";
import type { ExtractedFact, ProcessedDocument } from "@/lib/pdf/types";

describe("clampPage", () => {
  it("advances within bounds", () => {
    expect(clampPage(2, 5, 1)).toBe(3);
  });
  it("clamps at the last page", () => {
    expect(clampPage(5, 5, 1)).toBe(5);
  });
  it("clamps at the first page", () => {
    expect(clampPage(1, 5, -1)).toBe(1);
  });
  it("clamps a huge forward jump to the last page", () => {
    expect(clampPage(1, 5, 999)).toBe(5);
  });
  it("treats a single-page document as [1,1]", () => {
    expect(clampPage(1, 1, 1)).toBe(1);
    expect(clampPage(1, 1, -1)).toBe(1);
  });
});

const fact: ExtractedFact = {
  id: "fact-heading-1:0",
  kind: "heading",
  page: 1,
  rect: { x: 72, y: 700, w: 130, h: 18 },
  label: "H1 heading",
  detail: "Quarterly Report",
};

describe("factToRailFinding", () => {
  it("maps a positioned fact to an INCONCLUSIVE rail finding with real coordinates", () => {
    const finding = factToRailFinding(fact);
    expect(finding.verdict).toBe("INCONCLUSIVE");
    expect(finding.origin).toBe("extracted-fact");
    expect(finding.arithmetic).toBeNull();
    expect(finding.rect).toEqual(fact.rect);
    expect(finding.addr2).toBe("72,700");
  });

  it("marks a document-level fact (no rect) as doc-level, not a fabricated coordinate", () => {
    const docFact: ExtractedFact = { ...fact, id: "fact-classification", kind: "classification", rect: null };
    const finding = factToRailFinding(docFact);
    expect(finding.addr2).toBe("doc");
    expect(finding.rect).toBeNull();
  });
});

function docWithFacts(facts: ExtractedFact[]): ProcessedDocument {
  return {
    source: "upload",
    filename: "a.pdf",
    sizeBytes: 100,
    pdfType: "TextBased",
    confidence: 0.9,
    pageCount: 2,
    processingTimeMs: 10,
    title: null,
    hasEncodingIssues: false,
    isComplexLayout: false,
    pages: [],
    facts,
  };
}

describe("factsForPage", () => {
  it("filters facts to the requested page only", () => {
    const doc = docWithFacts([
      { ...fact, id: "a", page: 1 },
      { ...fact, id: "b", page: 2 },
    ]);
    expect(factsForPage(doc, 1).map((f) => f.id)).toEqual(["a"]);
    expect(factsForPage(doc, 2).map((f) => f.id)).toEqual(["b"]);
  });
});

describe("summaryChips", () => {
  it("returns the top 3 fact kinds by count, most common first", () => {
    const doc = docWithFacts([
      { ...fact, id: "h1", kind: "heading" },
      { ...fact, id: "h2", kind: "heading" },
      { ...fact, id: "l1", kind: "link" },
    ]);
    const chips = summaryChips(doc);
    expect(chips[0]).toEqual({ label: "HEADING", value: 2 });
    expect(chips[1]).toEqual({ label: "LINK", value: 1 });
  });

  it("falls back to a zero FACTS chip when nothing was extracted", () => {
    expect(summaryChips(docWithFacts([]))).toEqual([{ label: "FACTS", value: 0 }]);
  });
});

describe("formatBytes", () => {
  it("formats sub-KB sizes in bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });
  it("formats larger sizes in MB", () => {
    expect(formatBytes(2_500_000)).toBe("2.4 MB");
  });
});
