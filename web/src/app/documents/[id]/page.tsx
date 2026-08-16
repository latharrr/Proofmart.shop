import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";
import type { DocumentRow } from "@/lib/documents";
import SavedDocumentViewer from "@/components/documents/saved-document-viewer";
import { deleteDocument, rerunDocument } from "../actions";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: doc } = await supabase
    .from("documents")
    .select("id, filename, status, result, error_message, storage_pathname, verification_version, document_hash, created_at, updated_at")
    .eq("id", id)
    .maybeSingle<
      Pick<DocumentRow, "id" | "filename" | "status" | "result" | "error_message" | "storage_pathname" | "verification_version" | "document_hash" | "created_at" | "updated_at">
    >();

  if (!doc) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>
        <Link href="/documents" className="pm-hoverable" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontFamily: MONO, fontSize: 12, color: "#767C83" }}>
          ← My documents
        </Link>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", margin: "0 0 4px", wordBreak: "break-word" }}>{doc.filename}</h1>
            <p style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", margin: 0 }}>
              verified {new Date(doc.created_at).toLocaleString()}
              {doc.updated_at !== doc.created_at ? ` · re-run ${new Date(doc.updated_at).toLocaleString()}` : ""} · engine v{doc.verification_version}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {doc.status === "ready" && doc.document_hash && (
              <a
                href={`/api/documents/${doc.id}/dossier`}
                className="pm-hoverable"
                style={{ fontFamily: MONO, fontSize: 11, color: "#0E1216", background: "none", border: "1px solid #0E1216", borderRadius: 3, padding: "8px 12px", textDecoration: "none" }}
              >
                Download dossier ↓
              </a>
            )}
            {doc.storage_pathname && (
              <form action={rerunDocument.bind(null, doc.id)}>
                <button type="submit" className="pm-hoverable" style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", background: "none", border: "1px solid #DDE1E4", borderRadius: 3, padding: "8px 12px", cursor: "pointer" }}>
                  Re-run
                </button>
              </form>
            )}
            <form
              action={async () => {
                "use server";
                await deleteDocument(doc.id);
                redirect("/documents");
              }}
            >
              <button type="submit" className="pm-hoverable" style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", background: "none", border: "1px solid #DDE1E4", borderRadius: 3, padding: "8px 12px", cursor: "pointer" }}>
                Delete
              </button>
            </form>
          </div>
        </div>

        {doc.status === "error" && (
          <div style={{ fontFamily: SANS, fontSize: 14, color: "#B4231F", padding: "16px 0" }}>Processing failed: {doc.error_message}</div>
        )}

        {doc.status === "ready" && doc.result && <SavedDocumentViewer documentId={doc.id} envelope={doc.result} hasStoredFile={Boolean(doc.storage_pathname)} />}
      </div>
    </div>
  );
}
