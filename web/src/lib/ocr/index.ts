/**
 * Public surface of the OCR module. `/api/inspect` (and anything else that
 * needs OCR) should import from here rather than reaching into individual
 * files directly.
 */
export { TESSERACT_ASSET_PATHS, TesseractJsOcrProcessor } from "./tesseract-js";
export type { TesseractAssetPaths } from "./types";
