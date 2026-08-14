import "server-only";

import { FALLBACK_PAGE_SIZE, type RawExtraction } from "./extract";
import type { ExtractedFact, PdfClassification, PdfRect, ProcessedDocument, ProcessedPage } from "./types";

const MAX_FACTS_PER_KIND = 50;
const MAX_TOTAL_FACTS = 300;

const HEADING_ROLE = /^H[1-6]$/;

/**
 * pdf-inspector's positioned text/link bboxes come back in *native* PDF
 * space — origin at the bottom-left of the page, y increasing upward — even
 * though the library's region-based APIs (`extractTextInRegions` etc.) use
 * top-left origin for their own bbox *inputs*. Confirmed empirically: a
 * glyph drawn at pdf-lib y=720 on a 792pt-tall page comes back from
 * `extractTextWithPositions` as y=720, unchanged — i.e. still
 * distance-from-bottom, not distance-from-top.
 *
 * The rail's SVG overlay (and the client's pdf.js viewport) both use
 * top-left origin, so every content-derived rect has to be flipped here,
 * against the real page height pdf-lib reports (pdf-inspector never
 * returns page dimensions itself).
 */
export function toRailRect(x: number, y: number, w: number, h: number, pageHeightPt: number): PdfRect {
  return { x, y: pageHeightPt - (y + h), w, h };
}

export function normalizeDocument(
  raw: RawExtraction,
  classification: PdfClassification,
  meta: { filename: string; sizeBytes: number },
): ProcessedDocument {
  const pages: ProcessedPage[] = raw.markdown.pages.map((p) => {
    const pageNum = p.page + 1; // pdf-inspector's per-page markdown result is 0-indexed
    const size = raw.pageSizes.get(pageNum) ?? FALLBACK_PAGE_SIZE;
    return {
      page: pageNum,
      widthPt: size.widthPt,
      heightPt: size.heightPt,
      markdown: p.markdown,
      needsOcr: p.needsOcr,
      ocrReason: p.ocrReason ?? undefined,
      hasTable: raw.markdown.pagesWithTables.includes(pageNum),
      hasColumns: raw.markdown.pagesWithColumns.includes(pageNum),
    };
  });

  const facts = deriveFacts(raw, classification);

  return {
    source: "upload",
    filename: meta.filename,
    sizeBytes: meta.sizeBytes,
    pdfType: classification.pdfType,
    confidence: classification.confidence,
    pageCount: classification.pageCount,
    processingTimeMs: raw.meta.processingTimeMs,
    title: raw.meta.title ?? null,
    hasEncodingIssues: raw.meta.hasEncodingIssues,
    isComplexLayout: raw.markdown.isComplex,
    pages,
    facts,
  };
}

function deriveFacts(raw: RawExtraction, classification: PdfClassification): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  const push = (fact: ExtractedFact) => {
    if (facts.length < MAX_TOTAL_FACTS) facts.push(fact);
  };

  push({
    id: "fact-classification",
    kind: "classification",
    page: 1,
    rect: null,
    label: "Document type",
    detail: `${classification.pdfType.toUpperCase()} · ${Math.round(classification.confidence * 100)}% confidence — detected from PDF structure (text layer, fonts, embedded images), not content.`,
  });

  if (raw.meta.title && raw.meta.title.trim().length > 0) {
    push({
      id: "fact-title",
      kind: "title",
      page: 1,
      rect: null,
      label: "Document title (metadata)",
      detail: raw.meta.title,
    });
  }

  if (raw.meta.hasEncodingIssues) {
    push({
      id: "fact-encoding",
      kind: "encoding-issue",
      page: 1,
      rect: null,
      label: "Encoding issue detected",
      detail: "Some text may not decode reliably — broken font encoding or CID mapping.",
    });
  }

  for (const { page, reasons } of raw.markdown.ocrReasonsByPage) {
    push({
      id: `fact-ocr-${page}`,
      kind: "ocr-needed",
      page,
      rect: null,
      label: "OCR needed",
      detail: reasons.length > 0 ? `Page ${page}: ${reasons.join(", ")}` : `Page ${page}: text layer unreliable or absent.`,
    });
  }
  // Pages flagged as needing OCR without a specific reason recorded.
  for (const page of raw.markdown.pagesNeedingOcr) {
    if (raw.markdown.ocrReasonsByPage.some((r) => r.page === page)) continue;
    push({ id: `fact-ocr-${page}`, kind: "ocr-needed", page, rect: null, label: "OCR needed", detail: `Page ${page}: text layer unreliable or absent.` });
  }

  for (const page of raw.markdown.pagesWithTables) {
    push({
      id: `fact-table-${page}`,
      kind: "table",
      page,
      rect: null,
      label: "Table detected",
      detail: `Row/column structure detected on page ${page}.`,
    });
  }

  for (const fact of deriveHeadingFacts(raw)) push(fact);
  for (const fact of deriveLinkFacts(raw)) push(fact);
  for (const fact of deriveFormFieldFacts(raw)) push(fact);

  return facts;
}

function deriveHeadingFacts(raw: RawExtraction): ExtractedFact[] {
  const headingRoleByKey = new Map<string, string>();
  for (const el of raw.structureElements) {
    if (HEADING_ROLE.test(el.role)) headingRoleByKey.set(`${el.page}:${el.mcid}`, el.role);
  }
  if (headingRoleByKey.size === 0) return [];

  // Group text items sharing an mcid so a multi-run heading becomes one
  // fact with one bounding rect, not one fact per glyph run.
  const groups = new Map<string, { role: string; page: number; text: string[]; rect: PdfRect }>();
  for (const item of raw.textItems) {
    if (item.itemType !== "Text" || item.mcid === undefined || item.mcid === null) continue;
    const key = `${item.page}:${item.mcid}`;
    const role = headingRoleByKey.get(key);
    if (!role) continue;

    const existing = groups.get(key);
    const pageHeight = (raw.pageSizes.get(item.page) ?? FALLBACK_PAGE_SIZE).heightPt;
    const itemRect = toRailRect(item.x, item.y, item.width, item.height, pageHeight);
    if (!existing) {
      groups.set(key, { role, page: item.page, text: [item.text], rect: itemRect });
    } else {
      existing.text.push(item.text);
      existing.rect = union(existing.rect, itemRect);
    }
  }

  const facts: ExtractedFact[] = [];
  let i = 0;
  for (const [key, g] of groups) {
    facts.push({
      id: `fact-heading-${key}`,
      kind: "heading",
      page: g.page,
      rect: g.rect,
      label: `${g.role} heading`,
      detail: g.text.join("").trim() || "(empty)",
    });
    if (++i >= MAX_FACTS_PER_KIND) break;
  }
  return facts;
}

function deriveLinkFacts(raw: RawExtraction): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  for (const item of raw.textItems) {
    if (item.itemType !== "Link" || !item.linkUrl) continue;
    const pageHeight = (raw.pageSizes.get(item.page) ?? FALLBACK_PAGE_SIZE).heightPt;
    facts.push({
      id: `fact-link-${item.page}-${facts.length}`,
      kind: "link",
      page: item.page,
      rect: toRailRect(item.x, item.y, item.width, item.height, pageHeight),
      label: "Link",
      detail: item.linkUrl,
    });
    if (facts.length >= MAX_FACTS_PER_KIND) break;
  }
  return facts;
}

function deriveFormFieldFacts(raw: RawExtraction): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  for (const item of raw.textItems) {
    if (item.itemType !== "FormField") continue;
    const pageHeight = (raw.pageSizes.get(item.page) ?? FALLBACK_PAGE_SIZE).heightPt;
    facts.push({
      id: `fact-field-${item.page}-${facts.length}`,
      kind: "form-field",
      page: item.page,
      rect: toRailRect(item.x, item.y, item.width, item.height, pageHeight),
      label: "Form field",
      detail: item.text || "(unlabeled)",
    });
    if (facts.length >= MAX_FACTS_PER_KIND) break;
  }
  return facts;
}

export function union(a: PdfRect, b: PdfRect): PdfRect {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.w, b.x + b.w);
  const y2 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
