import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS, VERDICT } from "@/lib/evidence-data";
import { formatBytes } from "@/lib/pdf/rail-adapter";
import type { DocumentRow } from "@/lib/documents";
import { deleteDocument, rerunDocument } from "./actions";

const STATUS_LABEL: Record<DocumentRow["status"], string> = {
  processing: "PROCESSING",
  ready: "",
  error: "ERROR",
};

export default async function DocumentsPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: docs } = await supabase
    .from("documents")
    .select("id, filename, size_bytes, status, verdict, document_kind, findings_count, error_message, created_at")
    .order("created_at", { ascending: false })
    .returns<Pick<DocumentRow, "id" | "filename" | "size_bytes" | "status" | "verdict" | "document_kind" | "findings_count" | "error_message" | "created_at">[]>();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 24px" }}>
        <Link href="/" className="pm-hoverable" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, width: "fit-content" }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17, color: "#0E1216" }}>ProofMart</span>
        </Link>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>My documents</h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83", margin: "0 0 32px", lineHeight: 1.5 }}>
          Every document you verify while signed in is saved here automatically. Nothing here is shared or public.
        </p>

        {!docs || docs.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83" }}>
            No documents yet. <Link href="/#run" className="pm-hoverable" style={{ color: "#0E1216" }}>Verify one</Link> and it&apos;ll show up here.
          </p>
        ) : (
          <div style={{ border: "1px solid #DDE1E4", borderRadius: 3 }}>
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
                    borderTop: i === 0 ? "none" : "1px solid #DDE1E4",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="pm-hoverable"
                        style={{ fontFamily: SANS, fontSize: 14, color: "#0E1216", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}
                      >
                        {doc.filename}
                      </Link>
                      {v && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: v.color }}>
                          <span aria-hidden="true">{v.glyph}</span>
                          {doc.verdict}
                        </span>
                      )}
                      {doc.status !== "ready" && (
                        <span style={{ fontFamily: MONO, fontSize: 10, color: doc.status === "error" ? "#B4231F" : "#767C83", letterSpacing: "0.06em" }}>
                          {STATUS_LABEL[doc.status]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.02em" }}>
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
                      style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", border: "1px solid #DDE1E4", borderRadius: 3, padding: "6px 10px" }}
                    >
                      Open
                    </Link>
                    <form action={rerunDocument.bind(null, doc.id)}>
                      <button
                        type="submit"
                        className="pm-hoverable"
                        style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", background: "none", border: "1px solid #DDE1E4", borderRadius: 3, padding: "6px 10px", cursor: "pointer" }}
                      >
                        Re-run
                      </button>
                    </form>
                    <form action={deleteDocument.bind(null, doc.id)}>
                      <button
                        type="submit"
                        className="pm-hoverable"
                        style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", background: "none", border: "1px solid #DDE1E4", borderRadius: 3, padding: "6px 10px", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
