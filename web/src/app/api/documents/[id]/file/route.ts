import { get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

// @vercel/blob's get() is Node-only (same constraint as /api/inspect).
export const runtime = "nodejs";

/**
 * Streams a saved document's original PDF back to the browser so pdf.js can
 * re-render its pages — "Open result again" needs the real bytes, not just
 * the stored findings/verdict JSON. Ownership is enforced by the same RLS
 * policy that guards every other read of `documents` (`documents_select_own`)
 * — this route runs with the caller's own session, never the service role,
 * so a `.select()` that returns nothing IS the authorization check.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return Response.json({ error: "Not signed in." }, { status: 401 });

  const { data: doc } = await supabase.from("documents").select("storage_pathname, filename").eq("id", id).maybeSingle();
  if (!doc) return Response.json({ error: "Document not found." }, { status: 404 });
  if (!doc.storage_pathname) return Response.json({ error: "No stored file for this document." }, { status: 404 });

  const result = await get(doc.storage_pathname, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) return Response.json({ error: "Could not retrieve the stored file." }, { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
