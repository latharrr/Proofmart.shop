/**
 * Client-side PDF rendering — pdf.js runs in the browser (no native
 * dependency, unlike the inspector pipeline). This is the source of truth
 * for page geometry (`getPageDimensions`): pdf-inspector never returns page
 * width/height, only content bboxes, so the rail's annotation overlay is
 * sized against what pdf.js reports for the same page.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

let workerConfigured = false;

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjsLib;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjsLib = await loadPdfjs();
  // pdf.js detaches/transfers the buffer it's given — hand it a copy so the
  // caller's original ArrayBuffer (e.g. kept for re-reads) stays valid.
  const loadingTask = pdfjsLib.getDocument({ data: data.slice(0) });
  return loadingTask.promise;
}

export interface PageDimensions {
  widthPt: number;
  heightPt: number;
}

export async function getPageDimensions(pdf: PDFDocumentProxy, pageNumber: number): Promise<PageDimensions> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  return { widthPt: viewport.width, heightPt: viewport.height };
}

/**
 * Renders a page into `canvas`, scaled so its CSS box is `targetCssWidth`
 * wide, at the display's device pixel ratio for a crisp raster. Returns the
 * page's PDF-point dimensions (scale-1), which the caller uses as the
 * overlay SVG's `viewBox` — that's what keeps the annotation rect aligned
 * regardless of zoom or viewport size, independent of the canvas's own
 * pixel resolution.
 */
export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetCssWidth: number,
): Promise<PageDimensions> {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const scale = targetCssWidth > 0 ? targetCssWidth / base.width : 1;
  const viewport = page.getViewport({ scale: scale * dpr });

  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return { widthPt: base.width, heightPt: base.height };
}
