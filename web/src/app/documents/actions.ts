"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del, get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { runVerify } from "@/lib/api/pipeline";
import { ProcessingFailure } from "@/lib/pdf/types";
import { failedDocumentInsert, hashDocumentBytes, readyDocumentInsert } from "@/lib/documents";
import { recordAuditEvent } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");
  return userId;
}

export async function deleteDocument(id: string): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();

  // RLS (documents_select_own) already scopes this to the caller's own row —
  // .eq("user_id", userId) below is defense in depth, not the actual gate.
  const { data: doc } = await supabase.from("documents").select("storage_pathname").eq("id", id).eq("user_id", userId).maybeSingle();
  if (doc?.storage_pathname) void del(doc.storage_pathname).catch(() => {});

  await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
  await recordAuditEvent({ userId, eventType: "document_deleted", metadata: { documentId: id } });
  revalidatePath("/documents");
}

/**
 * Re-fetches the stored PDF and runs it through the pipeline again — useful
 * after a marker registry change, or just to double-check a result. Updates
 * the same row in place rather than creating a new one: one document per
 * uploaded file, its result always reflecting the most recent run.
 */
export async function rerunDocument(id: string): Promise<void> {
  const userId = await requireUserId();

  // Re-running invokes the full pipeline again (same cost as a fresh
  // upload) — same abuse-guard shape as /api/inspect's signed-in limit.
  const allowed = await checkRateLimit(`rerun:user:${userId}`, 600, 30);
  if (!allowed) return;

  const supabase = await createClient();

  const { data: doc } = await supabase.from("documents").select("filename, size_bytes, storage_pathname").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!doc?.storage_pathname) return;

  const result = await get(doc.storage_pathname, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) return;
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());

  try {
    const { document, verification } = await runVerify(buffer, { filename: doc.filename, sizeBytes: buffer.byteLength });
    await supabase
      .from("documents")
      .update({
        ...readyDocumentInsert({
          filename: doc.filename,
          sizeBytes: buffer.byteLength,
          document,
          verification,
          storagePathname: doc.storage_pathname,
          documentHash: hashDocumentBytes(buffer),
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);
    await recordAuditEvent({ userId, eventType: "document_rerun", metadata: { documentId: id, verdict: verification.verdict } });
  } catch (err) {
    const error = err instanceof ProcessingFailure ? err.error : { code: "processing-failed", message: "Unexpected server error while processing the PDF." };
    // A re-run that fails keeps the stored file (unlike a first-time upload
    // failure) — the file itself is already known-good enough to have
    // produced a prior result, so there's no reason to discard it.
    await supabase
      .from("documents")
      .update({ ...failedDocumentInsert({ filename: doc.filename, sizeBytes: buffer.byteLength, errorCode: error.code, errorMessage: error.message }), storage_pathname: doc.storage_pathname, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
}
