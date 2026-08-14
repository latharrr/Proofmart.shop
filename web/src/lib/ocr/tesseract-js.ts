import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import { createWorker, OEM, type Page as TesseractPage, type Word as TesseractWord, type Worker as TesseractWorker } from "tesseract.js";
import type { OCRProcessor, OCRTextItem } from "@/lib/pdf/types";
import { extractPageImage } from "./extract-page-image";
import type { TesseractAssetPaths } from "./types";

/**
 * Tesseract.js 7.0.0's Node worker has a real error-handling defect:
 * `createWorker.js` sets `worker.onerror = ...` on the underlying
 * `worker_threads.Worker`, but that's a browser-`Worker` convention — Node's
 * `Worker` is a plain `EventEmitter` and only reports errors via
 * `.on('error', ...)`, so `.onerror =` is silently never invoked. Verified
 * empirically (a bad `langPath` here): the failure surfaces as either an
 * uncaught exception or a `createWorker()` promise that never settles,
 * instead of a clean rejection — its own internal init chain also ends in a
 * bare `.catch(() => {})` that swallows any failure past the very first
 * init step without ever resolving or rejecting the promise callers await.
 * Two independent guards below exist because of this, not out of caution
 * for caution's sake: a pre-flight existence check (fails fast, in-process,
 * before ever touching the buggy path — covers the realistic "asset
 * missing" case entirely) and a hard timeout around worker creation
 * (bounds anything else that might hang instead of rejecting).
 */
const WORKER_INIT_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Every path here is resolved once, at module load, from real files already
 * on disk — never a URL, never fetched over the network.
 *
 * All three are built as plain string concatenation from `process.cwd()`
 * (the project root at runtime, both locally and in a deployed Vercel
 * function — the same reasoning `outputFileTracingIncludes` in
 * `next.config.ts` relies on, since its glob patterns are also
 * project-root-relative). This is deliberately NOT `require.resolve(...)`:
 * that was tried first and empirically breaks under this project's
 * Turbopack production build — Turbopack statically rewrites
 * `require.resolve("literal/package/path")` call sites into its own
 * internal numeric module IDs at build time, even for a package listed in
 * `serverExternalPackages`, so the "resolved path" turns out to be a bare
 * number at runtime, not a filesystem path. Verified via a real HTTP
 * request against `next build` + `next start` output, not just against
 * source run through vitest (which doesn't apply Turbopack's rewrite and
 * so never surfaced this).
 *
 * `workerPath`/`corePath` point into the installed `tesseract.js`/
 * `tesseract.js-core` npm packages (kept intact on disk because they're
 * `serverExternalPackages`). `langPath` points at `eng.traineddata.gz`,
 * vendored directly into this repo (`src/lib/ocr/tessdata/`) rather than
 * left inside a node_modules package, so its presence is a plain,
 * auditable file in source control.
 */
export const TESSERACT_ASSET_PATHS: TesseractAssetPaths = {
  workerPath: path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js"),
  // Ignored by Tesseract.js's own Node core loader (it always `require()`s
  // the SIMD-appropriate variant itself — see `TesseractJsOcrProcessor`'s
  // class doc) — set anyway so every asset category is explicit and
  // independently auditable, per the "no assumed single .wasm file" rule.
  corePath: path.join(process.cwd(), "node_modules", "tesseract.js-core", "tesseract-core-lstm.js"),
  langPath: path.join(process.cwd(), "src", "lib", "ocr", "tessdata"),
};

/** Flattens Tesseract.js's blocks → paragraphs → lines → words tree into a flat word list, skipping empty/negative-confidence entries exactly like the CLI processor's TSV parser does. */
function flattenWords(page: TesseractPage): TesseractWord[] {
  const words: TesseractWord[] = [];
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          if (word.text.trim() && word.confidence >= 0) words.push(word);
        }
      }
    }
  }
  return words;
}

/**
 * Production OCR processor: Tesseract.js (WASM, runs in-process via
 * `worker_threads`) with every runtime asset — worker script, WASM core,
 * English trained data — bundled locally. No system binary, no CDN, no
 * network call at recognition time; runs on Vercel's default Node.js
 * serverless runtime.
 *
 * One `TesseractJsOcrProcessor` is meant to back exactly one processing
 * job (see `PDFProcessor.applyOcr`, which constructs/reuses one OCR
 * processor per document and calls `terminate()` once at the end): the
 * underlying worker thread is created lazily on the first `recognize()`
 * call, reused for every subsequent page in that same job, and torn down
 * by `terminate()`. Never create a new instance per page — worker startup
 * (spawning the thread + loading the WASM core + the trained-data file) is
 * the expensive part.
 */
export class TesseractJsOcrProcessor implements OCRProcessor {
  private worker: Promise<TesseractWorker> | null = null;

  /** `assetPaths` defaults to the real bundled locations; tests override it to exercise failure modes (e.g. a missing/invalid langPath) without touching the production default. */
  constructor(private readonly assetPaths: TesseractAssetPaths = TESSERACT_ASSET_PATHS) {}

  private getWorker(): Promise<TesseractWorker> {
    if (!this.worker) {
      this.worker = this.initWorker();
    }
    return this.worker;
  }

  private async initWorker(): Promise<TesseractWorker> {
    this.assertAssetsPresent();
    return withTimeout(
      createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: this.assetPaths.workerPath,
        corePath: this.assetPaths.corePath,
        langPath: this.assetPaths.langPath,
        gzip: true,
        // No cache reads/writes: a serverless function's filesystem is
        // ephemeral/read-only outside `/tmp`, and every asset is already
        // local, so there is nothing a cache would save us from fetching.
        cacheMethod: "none",
        workerBlobURL: false, // browser-only option; explicit here for clarity, has no effect on Node.
      }),
      WORKER_INIT_TIMEOUT_MS,
      "Tesseract.js worker failed to initialize in time — a bundled OCR asset may be missing or corrupt.",
    );
  }

  /** Fails fast and clearly, before ever spawning a worker — see the class-level comment on `WORKER_INIT_TIMEOUT_MS` for why this matters more than it would for a well-behaved dependency. */
  private assertAssetsPresent(): void {
    const engData = path.join(this.assetPaths.langPath, "eng.traineddata.gz");
    const missing = [
      !existsSync(this.assetPaths.workerPath) && "workerPath",
      !existsSync(this.assetPaths.corePath) && "corePath",
      !existsSync(engData) && "langPath (eng.traineddata.gz)",
    ].filter((x): x is string => Boolean(x));
    if (missing.length > 0) {
      throw new Error(`TesseractJsOcrProcessor: missing local OCR asset(s): ${missing.join(", ")}`);
    }
  }

  async recognize(buffer: Buffer, page: number): Promise<OCRTextItem[]> {
    const image = await extractPageImage(buffer, page);
    if (!image) return [];

    const worker = await this.getWorker();
    const { data } = await worker.recognize(image.bytes, {}, { blocks: true });

    const scaleX = image.pageWidthPt / image.widthPx;
    const scaleY = image.pageHeightPt / image.heightPx;
    // Tesseract's word bbox and our rasterized image are both top-left
    // origin, y-down — a direct linear scale, no axis flip (same reasoning
    // as the CLI processor's coordinate handling).
    return flattenWords(data).map((word) => ({
      text: word.text,
      confidence: word.confidence / 100,
      rect: {
        x: word.bbox.x0 * scaleX,
        y: word.bbox.y0 * scaleY,
        w: (word.bbox.x1 - word.bbox.x0) * scaleX,
        h: (word.bbox.y1 - word.bbox.y0) * scaleY,
      },
    }));
  }

  async terminate(): Promise<void> {
    if (!this.worker) return;
    const workerPromise = this.worker;
    this.worker = null;
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch {
      // Worker never successfully initialized (missing/corrupt asset, init
      // timeout) — nothing real to terminate. Safe to call unconditionally.
    }
  }
}
