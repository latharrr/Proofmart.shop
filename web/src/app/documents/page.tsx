import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS, VERDICT } from "@/lib/evidence-data";
import { formatBytes } from "@/lib/pdf/rail-adapter";
import type { DocumentRow } from "@/lib/documents";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { deleteDocument, rerunDocument } from "./actions";

const STATUS_LABEL: Record<DocumentRow["status"], string> = {
  processing: "PROCESSING",
  ready: "",
  error: "ERROR",
};

const PAGE_SIZE = 25;

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: docs, count } = await supabase
    .from("documents")
    .select("id, filename, size_bytes, status, verdict, document_kind, findings_count, error_message, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .returns<Pick<DocumentRow, "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_message" | "created_at">[]>();

  const hasMore = (count ?? 0) > from + PAGE_SIZE;

  return (
    <div style={{ minHeight: "100vh", background: "var(--pm-paper)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <Wordmark href="/" />
        </div>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>My documents</h1>
        <p style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ash)", margin: "0 0 32px", lineHeight: 1.5 }}>
          Every document you verify while signed in is saved here automatically. Nothing here is shared or public.
        </p>

        {!docs || docs.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ash)" }}>
            No documents yet. <Link href="/#run" className="pm-hoverable" style={{ color: "var(--pm-ink)" }}>Verify one</Link> and it&apos;ll show up here.
          </p>
        ) : (
          <div style={{ border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)" }}>
            {docs.map((doc, i) => {
              const v = doc.verdict ? VERDICT[doc.verdict] : null;
              return (
                <div
                  key={doc.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderTop: i === 0 ? "none" : "1px solid var(--pm-hairline)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="pm-hoverable"
                        style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}
                      >
                        {doc.filename}
                      </Link>
                      {v && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: v.color }}>
                          <span aria-hidden="true">{v.glyph}</span>
                          {doc.verdict}
                        </span>
                      )}
                      {doc.status !== "ready" && (
                        <span style={{ fontFamily: MONO, fontSize: 12, color: doc.status === "error" ? "var(--pm-fail)" : "var(--pm-ash)", letterSpacing: "0.06em" }}>
                          {STATUS_LABEL[doc.status]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", letterSpacing: "0.02em" }}>
                      {doc.status === "ready"
                        ? `${doc.findings_count} finding${doc.findings_count === 1 ? "" : "s"} · ${doc.document_kind ?? "generic"} · ${formatBytes(doc.size_bytes)} · ${new Date(doc.created_at).toLocaleDateString()}`
                        : doc.status === "error"
                          ? `${doc.error_message ?? "Processing failed."} · ${new Date(doc.created_at).toLocaleDateString()}`
                          : new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="pm-hoverable"
                      style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-slate)", border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)", padding: "6px 10px" }}
                    >
                      Open
                    </Link>
                    <form action={rerunDocument.bind(null, doc.id)}>
                      <button
                        type="submit"
                        className="pm-hoverable"
                        style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-slate)", background: "none", border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)", padding: "6px 10px", cursor: "pointer" }}
                      >
                        Re-run
                      </button>
                    </form>
                    <form action={deleteDocument.bind(null, doc.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`Delete "${doc.filename}"? The stored file and its findings will be permanently removed — this can't be undone.`}
                        className="pm-hoverable"
                        style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", background: "none", border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)", padding: "6px 10px", cursor: "pointer" }}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(page > 1 || hasMore) && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontFamily: MONO, fontSize: 12 }}>
            {page > 1 ? (
              <Link href={`/documents?page=${page - 1}`} className="pm-hoverable" style={{ color: "var(--pm-ink)" }}>
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            {hasMore && (
              <Link href={`/documents?page=${page + 1}`} className="pm-hoverable" style={{ color: "var(--pm-ink)" }}>
                Older →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
