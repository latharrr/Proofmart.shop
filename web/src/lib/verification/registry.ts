import { balanceBreakMarker } from "./markers/balance-break";
import { crossPageTotalMismatchMarker } from "./markers/cross-page-total-mismatch";
import { dateSequenceAnomalyMarker } from "./markers/date-sequence-anomaly";
import { duplicateTransactionMarker } from "./markers/duplicate-transaction";
import { encodingAnomalyMarker } from "./markers/encoding-anomaly";
import { ocrLowConfidenceMarker } from "./markers/ocr-low-confidence";
import type { Marker } from "./types";

/**
 * Every implemented marker, in the order they run. Adding a marker means
 * writing one file under `markers/` and adding it here — the engine and
 * verdict logic never change.
 *
 * Markers considered and deliberately NOT implemented (see the previous
 * milestone report and the marker docstrings above for the full reasoning):
 *
 * - PRODUCER_MISMATCH — would require a real issuer/template registry
 *   (a genuine roster of "this producer string is valid for this issuer").
 *   No such registry exists; fabricating one would mean inventing
 *   credibility this pipeline doesn't have.
 * - FONT_METRIC_SHIFT — pdf-inspector's positioned text gives one width per
 *   text RUN, not per-glyph advance width, and there's no baseline/expected
 *   metrics table to compare against. The evidence this marker needs
 *   doesn't exist in the current pipeline.
 * - COLUMN_INCONSISTENCY (e.g. "this row has fewer/misaligned cells than
 *   its neighbors") — the reconstruction heuristic in
 *   `table-reconstruction.ts` already silently drops any item it can't
 *   confidently assign to a column (see `assignRowToColumns`'s 60pt
 *   distance guard), so "a row looks structurally different" is at least
 *   as likely to be an artifact of the reconstruction itself as of the
 *   source document — there's no way to tell the two apart with the data
 *   this pipeline has, and a marker that can't distinguish its own
 *   extraction noise from a real anomaly would produce mostly false
 *   positives.
 */
export const MARKER_REGISTRY: Marker[] = [
  ocrLowConfidenceMarker,
  encodingAnomalyMarker,
  balanceBreakMarker,
  duplicateTransactionMarker,
  dateSequenceAnomalyMarker,
  crossPageTotalMismatchMarker,
];
