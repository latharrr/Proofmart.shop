import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";
import CreateWebhookForm from "./create-webhook-form";
import { deleteWebhook, toggleWebhook } from "./actions";

interface WebhookRow {
  id: string;
  url: string;
  enabled: boolean;
  created_at: string;
}

interface DeliveryRow {
  webhook_endpoint_id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = { pending: "#767C83", success: "#1F6B4A", failed: "#B4231F", exhausted: "#B4231F" };

export default async function WebhooksPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: webhooks } = await supabase
    .from("webhook_endpoints")
    .select("id, url, enabled, created_at")
    .order("created_at", { ascending: false })
    .returns<WebhookRow[]>();

  const { data: deliveries } = await supabase
    .from("webhook_deliveries")
    .select("webhook_endpoint_id, event_type, status, attempt_count, created_at")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<DeliveryRow[]>();

  const deliveriesByWebhook = new Map<string, DeliveryRow[]>();
  for (const d of deliveries ?? []) {
    const list = deliveriesByWebhook.get(d.webhook_endpoint_id) ?? [];
    list.push(d);
    deliveriesByWebhook.set(d.webhook_endpoint_id, list);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
        <Link href="/" className="pm-hoverable" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, width: "fit-content" }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17, color: "#0E1216" }}>ProofMart</span>
        </Link>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>Webhooks</h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83", margin: "0 0 32px", lineHeight: 1.5 }}>
          Get <code style={{ fontFamily: MONO }}>verification.completed</code> and <code style={{ fontFamily: MONO }}>verification.failed</code> events pushed to
          your server whenever an API key of yours calls <code style={{ fontFamily: MONO }}>/v1/verify</code>. Each delivery is signed — verify the{" "}
          <code style={{ fontFamily: MONO }}>x-proofmart-signature</code> header with the secret shown at creation.
        </p>

        <div style={{ marginBottom: 40 }}>
          <CreateWebhookForm />
        </div>

        {!webhooks || webhooks.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: "#767C83" }}>No webhooks yet.</p>
        ) : (
          <div style={{ border: "1px solid #DDE1E4", borderRadius: 3 }}>
            {webhooks.map((hook, i) => {
              const recent = deliveriesByWebhook.get(hook.id) ?? [];
              return (
                <div key={hook.id} style={{ padding: "14px 16px", borderTop: i === 0 ? "none" : "1px solid #DDE1E4", opacity: hook.enabled ? 1 : 0.5 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 13, color: "#0E1216", wordBreak: "break-all" }}>{hook.url}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", marginTop: 4 }}>
                        {hook.enabled ? "enabled" : "disabled"} · added {new Date(hook.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <form action={toggleWebhook.bind(null, hook.id, !hook.enabled)}>
                        <button type="submit" className="pm-hoverable" style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", background: "none", border: "1px solid #DDE1E4", borderRadius: 3, padding: "6px 10px", cursor: "pointer" }}>
                          {hook.enabled ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteWebhook.bind(null, hook.id)}>
                        <button type="submit" className="pm-hoverable" style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", background: "none", border: "1px solid #DDE1E4", borderRadius: 3, padding: "6px 10px", cursor: "pointer" }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  {recent.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                      {recent.slice(0, 5).map((d, j) => (
                        <div key={j} style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", display: "flex", gap: 10 }}>
                          <span style={{ color: STATUS_COLOR[d.status] ?? "#767C83", fontWeight: 600 }}>{d.status.toUpperCase()}</span>
                          <span>{d.event_type}</span>
                          <span>{d.attempt_count} attempt{d.attempt_count === 1 ? "" : "s"}</span>
                          <span>{new Date(d.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
