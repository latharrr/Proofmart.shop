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
  "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_message" | "created_at"
>;

/**
 * My documents as a ruled schedule on the pad: one row per document, newest
 * first. Each row leads with a small page glyph whose flagged line carries the
 * verdict's pencil, so the verdicts read down the column before any text does.
 * The filename is the row's link (its hit area stretches across the row);
 * Re-run, Delete and the open arrow sit above that layer so they stay
 * separately clickable. On a phone each row folds into a three-line card.
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
  const tone = ready ? (doc.verdict ?? undefined) : doc.status;
  const sub =
    doc.status === "error"
      ? (doc.error_message ?? "Processing failed.")
      : doc.status === "processing"
        ? "Still being checked — refresh in a moment."
        : `${documentKindLabel(doc.document_kind)} · ${formatBytes(doc.size_bytes)}`;

  return (
    <li className="pm-docs-row" data-testid="document-row" data-status={doc.status} data-verdict={doc.verdict ?? undefined}>
      <div className="pm-docs-name">
        <span className="pm-docs-sheet" data-tone={tone} aria-hidden="true">
          <span />
          <span />
          <span />
          <span data-hit="" />
          <span />
        </span>
        <span className="pm-docs-name-text">
          <Link href={href} className="pm-docs-link">
            {doc.filename}
          </Link>
          <span className="pm-docs-sub" data-tone={doc.status === "error" ? "error" : undefined}>
            {sub}
          </span>
        </span>
      </div>

      <div className="pm-docs-verdict">
        {ready && doc.verdict ? <VerdictBadge verdict={doc.verdict} /> : doc.status !== "ready" ? <StatusBadge status={doc.status} /> : null}
      </div>

      <div className="pm-docs-count">
        {ready ? (
          <>
            <span className="pm-docs-count-n" data-zero={doc.findings_count === 0 || undefined}>
              {doc.findings_count}
            </span>
            <span className="pm-docs-count-l">{doc.findings_count === 1 ? "finding" : "findings"}</span>
          </>
        ) : (
          <span className="pm-docs-dim">—</span>
        )}
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
