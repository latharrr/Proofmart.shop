import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { OCRProcessor, OCRTextItem } from "@/lib/pdf/types";
import { extractPageImage } from "./extract-page-image";

interface TsvWord {
  left: number;
  top: number;
  width: number;
  height: number;
  conf: number;
  text: string;
}

function parseTsv(tsv: string): TsvWord[] {
  const [header, ...rows] = tsv.trim().split("\n");
  const cols = header.split("\t");
  const idx = (name: string) => cols.indexOf(name);
  const words: TsvWord[] = [];
  for (const row of rows) {
    const cells = row.split("\t");
    const text = cells[idx("text")]?.trim();
    const conf = Number(cells[idx("conf")]);
    if (!text || conf < 0) continue; // conf -1 rows are page/block/paragraph/line aggregates, not words
    words.push({
      left: Number(cells[idx("left")]),
      top: Number(cells[idx("top")]),
      width: Number(cells[idx("width")]),
      height: Number(cells[idx("height")]),
      conf,
      text,
    });
  }
  return words;
}

function runTesseractTsv(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("tesseract", [imagePath, "stdout", "tsv"]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("error", reject); // ENOENT when the `tesseract` binary isn't on PATH
    proc.on("close", (code) => (code === 0 ? resolve(stdout) : reject(new Error(stderr || `tesseract exited with code ${code}`))));
  });
}

/**
 * Real, local OCR via the system `tesseract` binary (Tesseract OCR /
 * `tesseract-ocr`) — no API key, no network call at runtime. Verified
 * working end-to-end in this project's dev environment.
 *
 * Not available on Vercel's default serverless runtime, which doesn't
 * bundle the binary — this processor is for environments that have it
 * installed (Docker/VPS with `apt-get install tesseract-ocr`, or a custom
 * Vercel build step that bundles a static binary). It is intentionally
 * **not** wired into `PDFProcessor` by default (see registry note in
 * `lib/verification/registry.ts`-style documentation, here in the
 * class doc) — callers opt in by constructing `PDFProcessor` with this
 * processor explicitly. When the binary is missing, `recognize` rejects
 * and the caller's existing try/catch around OCR (in
 * `PDFProcessor.processWithEvidence`) swallows it — the page stays
 * flagged via OCR_LOW_CONFIDENCE with no OCR text, never a fabricated
 * result.
 *
 * Limitations: only extracts JPEG or raw 8-bit RGB/Gray embedded page
 * images (see extract-page-image.ts), and assumes that image covers the
 * full page.
 */
export class TesseractCliOcrProcessor implements OCRProcessor {
  async recognize(buffer: Buffer, page: number): Promise<OCRTextItem[]> {
    const image = await extractPageImage(buffer, page);
    if (!image) return [];

    const dir = await mkdtemp(path.join(tmpdir(), "ocr-"));
    try {
      const imagePath = path.join(dir, `page.${image.format}`);
      await writeFile(imagePath, image.bytes);
      const tsv = await runTesseractTsv(imagePath);
      const scaleX = image.pageWidthPt / image.widthPx;
      const scaleY = image.pageHeightPt / image.heightPx;
      return parseTsv(tsv).map((w) => ({
        text: w.text,
        confidence: w.conf / 100,
        // Image pixel space and rail space are both top-left-origin,
        // y-down — a direct linear scale, no axis flip needed (unlike
        // native PDF-space coordinates elsewhere in this pipeline).
        rect: { x: w.left * scaleX, y: w.top * scaleY, w: w.width * scaleX, h: w.height * scaleY },
      }));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
