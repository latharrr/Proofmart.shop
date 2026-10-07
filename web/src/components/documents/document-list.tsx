import Link from "next/link";
import type { DocumentRow } from "@/lib/documents";
import { formatBytes } from "@/lib/pdf/rail-adapter";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { deleteDocument, rerunDocument } from "@/app/documents/actions";
import PendingSubmitButton from "./pending-submit-button";
import { StatusBadge, VerdictBadge, documentKindLabel, formatDay } from "./verdict";

export type DocumentListRow = Pick<
  DocumentRow,
  "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_message" | "created_at"
>;

/**
 * My documents as a ruled table: one row per document, newest first. The
 * filename is the row's link (its hit area stretches across the row); Re-run
 * and Delete sit above that layer so they stay separately clickable.
 * On a phone the columns fold into a two-line card per row.
 */
export default function DocumentList({ docs }: { docs: DocumentListRow[] }) {
  return (
    <div className="pm-docs" data-testid="documents-list">
      <div className="pm-docs-head" aria-hidden="true">
        <span>Document</span>
        <span>Verdict</span>
        <span>Findings</span>
        <span>Verified</span>
        <span className="pm-docs-head-actions">Actions</span>
      </div>
      <ul className="pm-docs-rows">
        {docs.map((doc) => (
          <DocumentListItem key={doc.id} doc={doc} />
        ))}
      </ul>
    </div>
  );
}

function DocumentListItem({ doc }: { doc: DocumentListRow }) {
  const href = `/documents/${doc.id}`;
  const ready = doc.status === "ready";
  const sub =
    doc.status === "error"
      ? (doc.error_message ?? "Processing failed.")
      : doc.status === "processing"
        ? "Still being checked — refresh in a moment."
        : `${documentKindLabel(doc.document_kind)} · ${formatBytes(doc.size_bytes)}`;

  return (
    <li className="pm-docs-row" data-testid="document-row" data-status={doc.status} data-verdict={doc.verdict ?? undefined}>
      <div className="pm-docs-name">
        <Link href={href} className="pm-docs-link">
          {doc.filename}
        </Link>
        <span className="pm-docs-sub" data-tone={doc.status === "error" ? "error" : undefined}>
          {sub}
        </span>
      </div>

      <div className="pm-docs-verdict">
        {ready && doc.verdict ? <VerdictBadge verdict={doc.verdict} /> : doc.status !== "ready" ? <StatusBadge status={doc.status} /> : null}
      </div>

      <div className="pm-docs-count">
        {ready ? (
          <span>
            <span className="pm-docs-count-n">{doc.findings_count}</span> {doc.findings_count === 1 ? "finding" : "findings"}
          </span>
        ) : (
          <span className="pm-docs-dim">—</span>
        )}
      </div>

      <div className="pm-docs-date">
        <time dateTime={doc.created_at}>{formatDay(doc.created_at)}</time>
      </div>

      <div className="pm-docs-actions">
        <Link href={href} className="pm-link pm-docs-open" aria-label={`Open ${doc.filename}`}>
          Open
          <span className="pm-arrow" aria-hidden="true">
            <span>→</span>
          </span>
        </Link>
        <form action={rerunDocument.bind(null, doc.id)}>
          <PendingSubmitButton className="pm-app-chip" pendingLabel="Re-running…" aria-label={`Re-run ${doc.filename}`}>
            Re-run
          </PendingSubmitButton>
        </form>
        <form action={deleteDocument.bind(null, doc.id)}>
          <ConfirmSubmitButton
            confirmMessage={`Delete "${doc.filename}"? The stored file and its findings will be permanently removed — this can't be undone.`}
            className="pm-app-chip pm-app-chip-quiet"
            aria-label={`Delete ${doc.filename}`}
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
    </li>
  );
}
