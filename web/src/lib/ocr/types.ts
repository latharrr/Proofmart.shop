/**
 * Local types for the Tesseract.js-backed OCR processor. Kept separate from
 * `@/lib/pdf/types` (which owns the `OCRProcessor`/`OCRTextItem` contract
 * every processor implements) — these are internal to how *this*
 * implementation locates its bundled assets.
 */

export interface TesseractAssetPaths {
  /** Absolute path to the Node worker-thread entry script (`tesseract.js`'s own package, not bundled by webpack). */
  workerPath: string;
  /**
   * Absolute path to a WASM core module file. Set explicitly for
   * documentation/audit purposes, but Tesseract.js's own Node-side core
   * loader (`worker-script/node/getCore.js`) ignores this argument and
   * always `require()`s the appropriate SIMD variant directly from the
   * `tesseract.js-core` package on disk — see the comment in
   * `tesseract-js.ts` for why we still set it.
   */
  corePath: string;
  /** Absolute path to the directory holding the bundled `eng.traineddata.gz` — never a URL. */
  langPath: string;
}
