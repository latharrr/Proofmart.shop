import Link from "next/link";
import type { DocumentRow } from "@/lib/documents";
import { formatBytes } from "@/lib/pdf/rail-adapter";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import RollLabel from "@/components/app/roll-label";
import Tickmark, { VERDICT_TICK } from "@/components/paper/tickmark";
import { deleteDocument, rerunDocument } from "@/app/documents/actions";
import PendingSubmitButton from "./pending-submit-button";
import { StatusBadge, VerdictBadge, documentKindLabel, formatDay } from "./verdict";

export type DocumentListRow = Pick<
  DocumentRow,
  "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_message" | "page_count" | "document_hash" | "created_at"
>;

/**
 * My documents as an index table: No. / file / sha256 / pages / verdict /
 * date, newest first. The filename is the row's link (its hit area
 * stretches across the row); Re-run, Delete and the open arrow sit above
 * that layer so they stay separately clickable. Hovering a row trails a
 * page-1 thumbnail (motion-layer.tsx). On a phone each row folds into a card.
 */
export default function DocumentList({ docs }: { docs: DocumentListRow[] }) {
  const tally = { FAIL: 0, REVIEW: 0, CLEAR: 0 };
  for (const d of docs) if (d.status === "ready" && d.verdict && d.verdict in tally) tally[d.verdict as keyof typeof tally] += 1;

  return (
    <div className="pm-docs" data-testid="documents-list">
      <div className="pm-docs-tally" aria-label="Verdicts in this list">
        {(["FAIL", "REVIEW", "CLEAR"] as const).map((v) => (
          <span key={v} className="pm-docs-tally-item" data-verdict={v} data-zero={tally[v] === 0 || undefined}>
            <span className="pm-docs-tally-n">{tally[v]}</span>
            <span className="pm-docs-tally-l">
              <Tickmark kind={VERDICT_TICK[v]} size={15} />
              {v}
            </span>
          </span>
        ))}
      </div>
      <div className="pm-docs-head" aria-hidden="true">
        <span>No.</span>
        <span>File</span>
        <span>sha256</span>
        <span>Pages</span>
        <span>Verdict</span>
        <span>Date</span>
        <span className="pm-docs-head-actions">Actions</span>
      </div>
      <ul className="pm-docs-rows">
        {docs.map((doc, i) => (
          <DocumentListItem key={doc.id} doc={doc} n={i} />
        ))}
      </ul>
    </div>
  );
}

function DocumentListItem({ doc, n }: { doc: DocumentListRow; n: number }) {
  const href = `/documents/${doc.id}`;
  const ready = doc.status === "ready";
  const sub =
    doc.status === "error"
      ? (doc.error_message ?? "Processing failed.")
      : doc.status === "processing"
        ? "Still being checked — refresh in a moment."
        : `${documentKindLabel(doc.document_kind)} · ${formatBytes(doc.size_bytes)} · ${doc.findings_count} ${doc.findings_count === 1 ? "finding" : "findings"}`;

  return (
    <li
      className="pm-docs-row"
      data-testid="document-row"
      data-status={doc.status}
      data-verdict={doc.verdict ?? undefined}
      data-cursor="inspect"
      data-preview={`doc:${doc.id}`}
      style={{ ["--n" as string]: n }}
    >
      <span className="pm-docs-n" aria-hidden="true">
        {String(n + 1).padStart(2, "0")}
      </span>
      <div className="pm-docs-name">
        <span className="pm-docs-name-text">
          <Link href={href} className="pm-docs-link">
            {doc.filename}
          </Link>
          <span className="pm-docs-sub" data-tone={doc.status === "error" ? "error" : undefined}>
            {sub}
          </span>
        </span>
      </div>

      <div className="pm-docs-hash" title={doc.document_hash ?? undefined}>
        {doc.document_hash ? `${doc.document_hash.slice(0, 8)}…` : <span className="pm-docs-dim">—</span>}
      </div>

      <div className="pm-docs-pages">{doc.page_count ?? <span className="pm-docs-dim">—</span>}</div>

      <div className="pm-docs-verdict">
        {ready && doc.verdict ? <VerdictBadge verdict={doc.verdict} /> : doc.status !== "ready" ? <StatusBadge status={doc.status} /> : null}
      </div>

      <div className="pm-docs-date">
        <time dateTime={doc.created_at}>{formatDay(doc.created_at)}</time>
      </div>

      <div className="pm-docs-actions">
        <form action={rerunDocument.bind(null, doc.id)}>
          <PendingSubmitButton variant="paper" pendingLabel="Re-running" aria-label={`Re-run ${doc.filename}`}>
            Re-run
          </PendingSubmitButton>
        </form>
        <form action={deleteDocument.bind(null, doc.id)}>
          <ConfirmSubmitButton
            confirmMessage={`Delete "${doc.filename}"? The stored file and its findings will be permanently removed — this can't be undone.`}
            className="pm-pill"
            data-variant="paper"
            data-size="sm"
            aria-label={`Delete ${doc.filename}`}
          >
            <RollLabel>Delete</RollLabel>
          </ConfirmSubmitButton>
        </form>
        <Link href={href} className="pm-docs-open" aria-label={`Open ${doc.filename}`}>
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 7.2h9.2M7.6 3.4 11.4 7.2 7.6 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </Link>
      </div>
    </li>
  );
}
