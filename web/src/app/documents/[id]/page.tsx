import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/documents";
import AppShell, { AppPage, AppPageHeader, VERIFY_HREF } from "@/components/app/app-shell";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import SavedDocumentViewer from "@/components/documents/saved-document-viewer";
import PendingSubmitButton from "@/components/documents/pending-submit-button";
import { StatusBadge, VerdictBadge, formatDayTime } from "@/components/documents/verdict";
import { deleteDocument, rerunDocument } from "../actions";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  const { data: doc } = await supabase
    .from("documents")
    .select("id, filename, status, result, error_message, storage_pathname, verification_version, document_hash, created_at, updated_at")
    .eq("id", id)
    .maybeSingle<
      Pick<DocumentRow, "id" | "filename" | "status" | "result" | "error_message" | "storage_pathname" | "verification_version" | "document_hash" | "created_at" | "updated_at">
    >();

  if (!doc) notFound();

  const verdict = doc.status === "ready" ? (doc.result?.verdict ?? null) : null;
  const rerun = doc.updated_at !== doc.created_at;

  const actions = (
    <>
      {doc.status === "ready" && doc.document_hash && (
        <a href={`/api/documents/${doc.id}/dossier`} className="pm-btn pm-btn-filled pm-btn-sm">
          Download dossier
          <span aria-hidden="true" style={{ marginLeft: 8 }}>
            ↓
          </span>
        </a>
      )}
      {doc.storage_pathname && (
        <form action={rerunDocument.bind(null, doc.id)}>
          <PendingSubmitButton className="pm-btn pm-btn-ghost pm-btn-sm" pendingLabel="Re-running…">
            Re-run
          </PendingSubmitButton>
        </form>
      )}
      <form
        action={async () => {
          "use server";
          await deleteDocument(doc.id);
          redirect("/documents");
        }}
      >
        <ConfirmSubmitButton
          confirmMessage={`Delete "${doc.filename}"? The stored file and its findings will be permanently removed — this can't be undone.`}
          className="pm-app-chip pm-app-chip-quiet pm-app-chip-lg"
        >
          Delete
        </ConfirmSubmitButton>
      </form>
    </>
  );

  return (
    <AppShell active="documents" email={email}>
      <AppPage>
        <AppPageHeader
          back={{ href: "/documents", label: "My documents" }}
          meta={
            <div className="pm-report-badges">
              {verdict ? <VerdictBadge verdict={verdict} /> : doc.status !== "ready" ? <StatusBadge status={doc.status} /> : null}
            </div>
          }
          title={<span className="pm-report-title">{doc.filename}</span>}
          description={
            <>
              Verified <time dateTime={doc.created_at}>{formatDayTime(doc.created_at)}</time>
              {rerun && (
                <>
                  {" · "}re-run <time dateTime={doc.updated_at}>{formatDayTime(doc.updated_at)}</time>
                </>
              )}
              {" · "}engine <span className="pm-mono">v{doc.verification_version}</span>
            </>
          }
          actions={actions}
        />

        {doc.status === "error" && (
          <div className="pm-app-notice" role="alert">
            <p className="pm-app-notice-title">This document couldn&apos;t be processed.</p>
            <p className="pm-app-notice-body">{doc.error_message ?? "Processing failed."}</p>
            <p className="pm-app-notice-body">
              {doc.storage_pathname
                ? "The file is still stored, so you can re-run it."
                : "The file wasn't kept, so it can't be re-run here. Upload it again to get a report."}
            </p>
            {!doc.storage_pathname && (
              <Link href={VERIFY_HREF} className="pm-btn pm-btn-ghost pm-btn-sm">
                Verify a document
              </Link>
            )}
          </div>
        )}

        {doc.status === "processing" && (
          <div className="pm-app-notice" role="status">
            <p className="pm-app-notice-title">Still being checked.</p>
            <p className="pm-app-notice-body">The report appears here as soon as every marker has run.</p>
            <Link href={`/documents/${doc.id}`} className="pm-btn pm-btn-ghost pm-btn-sm">
              Refresh
            </Link>
          </div>
        )}

        {doc.status === "ready" && doc.result && <SavedDocumentViewer documentId={doc.id} envelope={doc.result} hasStoredFile={Boolean(doc.storage_pathname)} />}
      </AppPage>
    </AppShell>
  );
}
