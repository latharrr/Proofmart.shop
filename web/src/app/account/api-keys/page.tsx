import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";
import CreateKeyForm from "./create-key-form";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { revokeApiKey } from "./actions";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const PAGE_SIZE = 25;

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: keys, count } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
    .returns<ApiKeyRow[]>();

  const hasMore = (count ?? 0) > from + PAGE_SIZE;

  return (
    <div style={{ minHeight: "100vh", background: "var(--pm-paper)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <Wordmark href="/" />
        </div>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>API keys</h1>
        <p style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ash)", margin: "0 0 32px", lineHeight: 1.5 }}>
          Use a key to call <code style={{ fontFamily: MONO }}>/v1/verify</code>, <code style={{ fontFamily: MONO }}>/v1/inspect</code>, and{" "}
          <code style={{ fontFamily: MONO }}>/v1/extract</code> directly. Each key is shown in full only once, at creation.
        </p>

        <div style={{ marginBottom: 40 }}>
          <CreateKeyForm />
        </div>

        {!keys || keys.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ash)" }}>No API keys yet.</p>
        ) : (
          <div style={{ border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)" }}>
            {keys.map((key, i) => (
              <div
                key={key.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--pm-hairline)",
                  opacity: key.revoked_at ? 0.5 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ink)", fontWeight: 500 }}>{key.name}</span>
                    {key.revoked_at && (
                      <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-fail)", letterSpacing: "0.06em" }}>REVOKED</span>
                    )}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", letterSpacing: "0.02em" }}>
                    {key.key_prefix}… · created {new Date(key.created_at).toLocaleDateString()} ·{" "}
                    {key.last_used_at ? `last used ${new Date(key.last_used_at).toLocaleDateString()}` : "never used"}
                  </div>
                </div>
                {!key.revoked_at && (
                  <form action={revokeApiKey.bind(null, key.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Revoke "${key.name}"? Anything using this key will stop working immediately — this can't be undone.`}
                      className="pm-hoverable"
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "var(--pm-ash)",
                        background: "none",
                        border: "1px solid var(--pm-hairline)",
                        borderRadius: "var(--pm-r-image)",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Revoke
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {(page > 1 || hasMore) && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontFamily: MONO, fontSize: 12 }}>
            {page > 1 ? (
              <Link href={`/account/api-keys?page=${page - 1}`} className="pm-hoverable" style={{ color: "var(--pm-ink)" }}>
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            {hasMore && (
              <Link href={`/account/api-keys?page=${page + 1}`} className="pm-hoverable" style={{ color: "var(--pm-ink)" }}>
                Older →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
