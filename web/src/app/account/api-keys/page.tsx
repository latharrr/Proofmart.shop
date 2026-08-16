import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";
import CreateKeyForm from "./create-key-form";
import { revokeApiKey } from "./actions";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default async function ApiKeysPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false })
    .returns<ApiKeyRow[]>();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
        <Link href="/" className="pm-hoverable" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, width: "fit-content" }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17, color: "#0E1216" }}>ProofMart</span>
        </Link>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>API keys</h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83", margin: "0 0 32px", lineHeight: 1.5 }}>
          Use a key to call <code style={{ fontFamily: MONO }}>/v1/verify</code>, <code style={{ fontFamily: MONO }}>/v1/inspect</code>, and{" "}
          <code style={{ fontFamily: MONO }}>/v1/extract</code> directly. Each key is shown in full only once, at creation.
        </p>

        <div style={{ marginBottom: 40 }}>
          <CreateKeyForm />
        </div>

        {!keys || keys.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83" }}>No API keys yet.</p>
        ) : (
          <div style={{ border: "1px solid #DDE1E4", borderRadius: 3 }}>
            {keys.map((key, i) => (
              <div
                key={key.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderTop: i === 0 ? "none" : "1px solid #DDE1E4",
                  opacity: key.revoked_at ? 0.5 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: SANS, fontSize: 14, color: "#0E1216", fontWeight: 500 }}>{key.name}</span>
                    {key.revoked_at && (
                      <span style={{ fontFamily: MONO, fontSize: 10, color: "#B4231F", letterSpacing: "0.06em" }}>REVOKED</span>
                    )}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.02em" }}>
                    {key.key_prefix}… · created {new Date(key.created_at).toLocaleDateString()} ·{" "}
                    {key.last_used_at ? `last used ${new Date(key.last_used_at).toLocaleDateString()}` : "never used"}
                  </div>
                </div>
                {!key.revoked_at && (
                  <form action={revokeApiKey.bind(null, key.id)}>
                    <button
                      type="submit"
                      className="pm-hoverable"
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "#767C83",
                        background: "none",
                        border: "1px solid #DDE1E4",
                        borderRadius: 3,
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Revoke
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
