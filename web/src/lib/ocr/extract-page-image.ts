import "server-only";

import { inflateSync } from "node:zlib";
import { PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { encodeRgbPng } from "./png-codec";

export interface PageImage {
  bytes: Buffer;
  format: "jpg" | "png";
  widthPx: number;
  heightPx: number;
  pageWidthPt: number;
  pageHeightPt: number;
}

/**
 * Extracts the page's embedded raster image, for OCR — not general PDF
 * image extraction. Handles the two encodings that matter for the common
 * "single full-page scan" case: JPEG (DCTDecode, written through as-is)
 * and raw 8-bit RGB/Gray (FlateDecode, inflated and re-encoded as PNG so
 * the OCR binary can read it). Other encodings (CCITTFax, JPX, indexed
 * color) return `null` — no OCR text is produced for that page, never a
 * guess.
 */
export async function extractPageImage(buffer: Buffer, page: number): Promise<PageImage | null> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
  const pdfPage = doc.getPages()[page - 1];
  if (!pdfPage) return null;
  const { width: pageWidthPt, height: pageHeightPt } = pdfPage.getSize();

  const resources = pdfPage.node.Resources();
  const xobjects = resources?.lookupMaybe(PDFName.of("XObject"), PDFDict);
  if (!xobjects) return null;

  for (const [, ref] of xobjects.entries()) {
    const obj = doc.context.lookup(ref);
    if (!(obj instanceof PDFRawStream)) continue;
    if (obj.dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;

    const widthPx = Number(obj.dict.get(PDFName.of("Width"))?.toString());
    const heightPx = Number(obj.dict.get(PDFName.of("Height"))?.toString());
    if (!widthPx || !heightPx) continue;

    const filter = obj.dict.get(PDFName.of("Filter"))?.toString();
    const contents = Buffer.from(obj.contents);

    if (filter === "/DCTDecode") {
      return { bytes: contents, format: "jpg", widthPx, heightPx, pageWidthPt, pageHeightPt };
    }

    if (filter === "/FlateDecode") {
      const colorSpace = obj.dict.get(PDFName.of("ColorSpace"))?.toString();
      const bpc = Number(obj.dict.get(PDFName.of("BitsPerComponent"))?.toString() ?? "8");
      if (bpc !== 8) continue;

      if (colorSpace === "/DeviceRGB") {
        const raw = inflateSync(contents);
        return { bytes: encodeRgbPng(widthPx, heightPx, raw), format: "png", widthPx, heightPx, pageWidthPt, pageHeightPt };
      }
      if (colorSpace === "/DeviceGray") {
        const raw = inflateSync(contents);
        const rgb = Buffer.alloc(widthPx * heightPx * 3);
        for (let i = 0; i < widthPx * heightPx; i++) {
          rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = raw[i];
        }
        return { bytes: encodeRgbPng(widthPx, heightPx, rgb), format: "png", widthPx, heightPx, pageWidthPt, pageHeightPt };
      }
    }
    // CCITTFax / JPXDecode / indexed color / other encodings: not handled.
  }
  return null;
}
