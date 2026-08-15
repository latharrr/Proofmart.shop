import "server-only";

import { FALLBACK_PAGE_SIZE, type RawExtraction, type TextItem } from "./extract";
import type { ExtractedFact, PdfClassification, PdfRect, ProcessedDocument, ProcessedPage } from "./types";

const MAX_FACTS_PER_KIND = 50;
const MAX_TOTAL_FACTS = 300;

/**
 * Mean glyph advance as a fraction of font size, used only by
 * `textItemWidth` below. 0.5 is the conventional approximation for
 * proportional sans-serif faces (Helvetica's lowercase advances cluster
 * around 0.5–0.56em); it is an average, never an exact measurement.
 */
const MEAN_GLYPH_ADVANCE_RATIO = 0.5;

/**
 * Width of a positioned text run, in PDF points.
 *
 * pdf-inspector 1.12.0 — the version this project is pinned to, because
 * 1.13.0+ ships binaries requiring a GLIBC newer than Vercel provides (see
 * the version note in `extract.ts`) — returns `width: 0` for every
 * glyph-derived text item, verified empirically against real extractions.
 * Its `x`, `y`, `height`, `fontSize`, and `text` are all correct; only the
 * run's measured advance width is missing.
 *
 * Without a width, every evidence highlight the rail draws over a text run
 * collapses to an invisible zero-width sliver (caught by the Playwright
 * overlay tests, not by unit tests). So when — and only when — the real
 * width is absent, this estimates one from the exact font size and
 * character count.
 *
 * This estimate sizes a *highlight box*; it is never part of a finding's
 * evidence. A finding's page, coordinates, and arithmetic all remain
 * exactly what the document itself reports. The estimate can run slightly
 * wide or narrow versus the true glyph run, especially for monospace or
 * condensed faces. A real width, whenever the library provides one, always
 * wins — so this self-heals if the version pin is ever lifted.
 */
export function textItemWidth(item: Pick<TextItem, "width" | "text" | "fontSize">): number {
  if (item.width > 0) return item.width;
  return item.text.length * item.fontSize * MEAN_GLYPH_ADVANCE_RATIO;
}

/** Rail-space rect for a positioned text run, with the width fallback above applied. */
export function textItemRect(item: TextItem, pageHeightPt: number): PdfRect {
  return toRailRect(item.x, item.y, textItemWidth(item), item.height, pageHeightPt);
}

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
    detail: `${classification.pdfType.toUpperCase()} · ${Math.round(classification.confidence * 100)}% confidence. Detected from PDF structure (text layer, fonts, embedded images), not content.`,
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
      detail: "Some text may not decode reliably: broken font encoding or CID mapping.",
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

  // No heading facts: deriving them needs `extractStructureElements` (the
  // PDF's own tagged-structure H1–H6 roles), which only exists in
  // pdf-inspector 1.14.0+ — a version whose native binary can't load on
  // Vercel (see the version note in `extract.ts`). Guessing headings from
  // font size or markdown `#` prefixes would be a different, weaker signal
  // presented under the same name, so nothing is substituted. The `heading`
  // fact kind itself is retained: the bundled sample document still uses
  // it, and it becomes live again if the pin is ever lifted.
  for (const fact of deriveLinkFacts(raw)) push(fact);
  for (const fact of deriveFormFieldFacts(raw)) push(fact);

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
      // Link rects come from the PDF's own /Annots geometry, so their width
      // is real; `textItemRect` passes it straight through, and only fills
      // in a width for the glyph-derived items that lack one.
      rect: textItemRect(item, pageHeight),
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
      rect: textItemRect(item, pageHeight),
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
