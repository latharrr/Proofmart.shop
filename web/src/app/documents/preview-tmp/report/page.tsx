// TEMPORARY preview with fake data — delete before finishing.
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import SavedDocumentViewer from "@/components/documents/saved-document-viewer";
import RollPill from "@/components/motion/roll-pill";
import RollLabel from "@/components/app/roll-label";
import { VerdictBadge, filenameParts, formatDayTime } from "@/components/documents/verdict";
import type { VerifyEnvelope } from "@/lib/api/envelope";

const f = (id: string, markerId: string, markerName: string, verdict: string, summary: string, detail: string, page: number, rect: { x: number; y: number; w: number; h: number } | null) => ({
  id, markerId, markerName, category: "arithmetic", severity: "high", verdict, evidence: { summary, detail, coordinates: [{ page, rect }] },
});
const envelope = {
  document: { filename: "hdfc_apr25_statement.pdf", sizeBytes: 2_200_000, pageCount: 6, title: null },
  classification: { pdfType: "TEXTBASED", confidence: 0.98, documentKind: "bank_statement", hasEncodingIssues: false, isComplexLayout: false },
  verdict: "FAIL",
  findings: [
    f("f1", "BALANCE_BREAK", "Running balance break", "FAIL", "Running balance differs from prior + credit − debit by ₹5,000.00.", "84,210.00 + 12,500.00 = 96,710.00\ndocument shows           91,710.00", 4, { x: 548, y: 528, w: 68, h: 22 }),
    f("f2", "CROSS_PAGE_TOTAL_MISMATCH", "Carried balance mismatch", "FAIL", "Balance carried from page 3 to page 4 differs by ₹1,240.00.", "page 3 closing 1,07,880.00\npage 4 opening 1,09,120.00", 4, { x: 548, y: 88, w: 68, h: 22 }),
    f("f3", "DUPLICATE_TRANSACTION", "Duplicate transaction", "REVIEW", "2 transactions share date 08 Apr and amount 2,500.00.", "matched on identical date + amount across 2 rows", 2, { x: 214, y: 338, w: 96, h: 22 }),
  ],
  facts: [],
  processing: {
    processingTimeMs: 4800,
    markersRun: ["BALANCE_BREAK", "CROSS_PAGE_TOTAL_MISMATCH", "DUPLICATE_TRANSACTION", "ROUND_NUMBER", "DATE_ORDER", "FONT_MIX"],
    markersSkipped: [{ markerId: "OCR_LOW_CONFIDENCE", reason: "Text-based PDF; no OCR ran." }],
    pages: Array.from({ length: 6 }, (_, i) => ({ page: i + 1, widthPt: 612, heightPt: 792 })),
  },
} as unknown as VerifyEnvelope;

export default function Preview() {
  const created = new Date(Date.now() - 3600_000).toISOString();
  return (
    <AppShell active="documents" email="gate4-e2e-test@proofmart.internal">
      <AppPage>
        <AppPageHeader
          back={{ href: "/documents", label: "My documents" }}
          size="md"
          meta={<div className="pm-report-badges"><VerdictBadge verdict="FAIL" /><span className="pm-app-count">Report</span></div>}
          title={filenameParts("hdfc_apr25_statement.pdf")}
          description={<>Verified <time>{formatDayTime(created)}</time> · engine <span className="pm-mono">v0.9.14</span></>}
          actions={
            <>
              <RollPill href="#" native size="sm" dot>Download dossier</RollPill>
              <RollPill variant="secondary" size="sm">Re-run</RollPill>
              <button type="button" className="pm-pill" data-variant="paper" data-size="sm"><RollLabel>Delete</RollLabel></button>
            </>
          }
        />
        <SavedDocumentViewer documentId="x" envelope={envelope} hasStoredFile={false} />
      </AppPage>
    </AppShell>
  );
}
