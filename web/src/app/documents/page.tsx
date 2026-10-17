import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/documents";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import RollPill from "@/components/motion/roll-pill";
import DocumentList from "@/components/documents/document-list";
import DocumentsEmpty from "@/components/documents/documents-empty";

const PAGE_SIZE = 25;

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const {
    data: docs,
    count,
    error,
  } = await supabase
    .from("documents")
    .select("id, filename, size_bytes, status, verdict, document_kind, findings_count, error_message, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .returns<Pick<DocumentRow, "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_message" | "created_at">[]>();

  const total = count ?? 0;
  const hasMore = total > from + PAGE_SIZE;
  const hasDocs = Boolean(docs && docs.length > 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell active="documents" email={email}>
      <AppPage>
        <AppPageHeader
          title="My documents"
          description="Every PDF you verify while signed in is saved here with its report. Only you can see them."
          meta={
            hasDocs ? (
              <p className="pm-app-count">
                {total} {total === 1 ? "document" : "documents"}
              </p>
            ) : undefined
          }
        />

        {error ? (
          <div className="pm-app-notice" role="alert">
            <p className="pm-app-notice-title">Your documents couldn&apos;t be loaded.</p>
            <p className="pm-app-notice-body">Nothing has been lost — this is a problem reaching storage. Reload the page to try again.</p>
            <RollPill href={page > 1 ? `/documents?page=${page}` : "/documents"} variant="secondary" size="sm">
              Reload
            </RollPill>
          </div>
        ) : hasDocs && docs ? (
          <DocumentList docs={docs} />
        ) : page > 1 ? (
          <div className="pm-app-notice">
            <p className="pm-app-notice-title">There&apos;s nothing on page {page}.</p>
            <p className="pm-app-notice-body">You may have deleted the documents that were here.</p>
            <RollPill href="/documents" variant="secondary" size="sm">
              Back to the newest
            </RollPill>
          </div>
        ) : (
          <DocumentsEmpty />
        )}

        {(page > 1 || hasMore) && hasDocs && (
          <nav className="pm-pager" aria-label="Pages">
            {page > 1 ? (
              <RollPill href={`/documents?page=${page - 1}`} variant="secondary" size="sm" rel="prev">
                Newer
              </RollPill>
            ) : (
              <span />
            )}
            <span className="pm-pager-pos">
              Page {page} of {totalPages}
            </span>
            {hasMore ? (
              <RollPill href={`/documents?page=${page + 1}`} variant="secondary" size="sm" dot rel="next">
                Older
              </RollPill>
            ) : (
              <span />
            )}
          </nav>
        )}
      </AppPage>
    </AppShell>
  );
}
