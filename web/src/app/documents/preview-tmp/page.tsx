// TEMPORARY preview with fake data — delete before finishing.
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import DocumentList, { type DocumentListRow } from "@/components/documents/document-list";

const now = Date.now();
const day = 86400000;
const docs: DocumentListRow[] = [
  { id: "a1", filename: "hdfc_apr25_statement.pdf", size_bytes: 2_200_000, status: "ready", verdict: "FAIL", document_kind: "bank_statement", findings_count: 4, error_message: null, created_at: new Date(now - day * 0.2).toISOString() },
  { id: "a2", filename: "invoice-INV-1092-acme-services.pdf", size_bytes: 340_000, status: "ready", verdict: "REVIEW", document_kind: "invoice", findings_count: 1, error_message: null, created_at: new Date(now - day * 1).toISOString() },
  { id: "a3", filename: "salary_slip_sep_2026.pdf", size_bytes: 120_000, status: "ready", verdict: "CLEAR", document_kind: "salary_slip", findings_count: 0, error_message: null, created_at: new Date(now - day * 3).toISOString() },
  { id: "a4", filename: "upi_payment_proof_9921.pdf", size_bytes: 88_000, status: "processing", verdict: null, document_kind: null, findings_count: 0, error_message: null, created_at: new Date(now - day * 4).toISOString() },
  { id: "a5", filename: "scanned_statement_q2_icici_very_long_filename_final_v3.pdf", size_bytes: 9_400_000, status: "error", verdict: null, document_kind: null, findings_count: 0, error_message: "The PDF is encrypted and couldn't be opened.", created_at: new Date(now - day * 9).toISOString() },
  { id: "a6", filename: "axis_mar25_statement.pdf", size_bytes: 1_900_000, status: "ready", verdict: "CLEAR", document_kind: "bank_statement", findings_count: 0, error_message: null, created_at: new Date(now - day * 12).toISOString() },
] as unknown as DocumentListRow[];

export default function Preview() {
  return (
    <AppShell active="documents" email="gate4-e2e-test@proofmart.internal">
      <AppPage>
        <AppPageHeader title="My documents" description="Every PDF you verify while signed in is saved here with its report. Only you can see them." meta={<p className="pm-app-count">6 documents</p>} />
        <DocumentList docs={docs} />
      </AppPage>
    </AppShell>
  );
}
