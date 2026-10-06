import Wordmark from "@/components/brand/wordmark";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MONO, SANS } from "@/lib/evidence-data";
import CreateWebhookForm from "./create-webhook-form";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
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

const STATUS_COLOR: Record<string, string> = { pending: "var(--pm-ash)", success: "var(--pm-clear)", failed: "var(--pm-fail)", exhausted: "var(--pm-fail)" };

export default async function WebhooksPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: webhooks } = await supabase
    .from("webhook_endpoints")
    .select("id, url, enabled, created_at")
    .order("created_at", { ascending: false })
    .returns<WebhookRow[]>();

  // Bounded, but scaled to webhook count — a flat limit(20) shared across
  // every webhook let one noisy endpoint crowd out the rest; each webhook
  // only ever displays its own most recent 5 below.
  const deliveryFetchLimit = Math.min(200, Math.max(20, (webhooks?.length ?? 0) * 20));
  const { data: deliveries } = await supabase
    .from("webhook_deliveries")
    .select("webhook_endpoint_id, event_type, status, attempt_count, created_at")
    .order("created_at", { ascending: false })
    .limit(deliveryFetchLimit)
    .returns<DeliveryRow[]>();

  const deliveriesByWebhook = new Map<string, DeliveryRow[]>();
  for (const d of deliveries ?? []) {
    const list = deliveriesByWebhook.get(d.webhook_endpoint_id) ?? [];
    list.push(d);
    deliveriesByWebhook.set(d.webhook_endpoint_id, list);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--pm-paper)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <Wordmark href="/" />
        </div>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", margin: "0 0 6px" }}>Webhooks</h1>
        <p style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ash)", margin: "0 0 32px", lineHeight: 1.5 }}>
          Get <code style={{ fontFamily: MONO }}>verification.completed</code> and <code style={{ fontFamily: MONO }}>verification.failed</code> events pushed to
          your server whenever an API key of yours calls <code style={{ fontFamily: MONO }}>/v1/verify</code>. Each delivery is signed — verify the{" "}
          <code style={{ fontFamily: MONO }}>x-proofmart-signature</code> header with the secret shown at creation.
        </p>

        <div style={{ marginBottom: 40 }}>
          <CreateWebhookForm />
        </div>

        {!webhooks || webhooks.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 17, color: "var(--pm-ash)" }}>No webhooks yet.</p>
        ) : (
          <div style={{ border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)" }}>
            {webhooks.map((hook, i) => {
              const recent = deliveriesByWebhook.get(hook.id) ?? [];
              return (
                <div key={hook.id} style={{ padding: "14px 16px", borderTop: i === 0 ? "none" : "1px solid var(--pm-hairline)", opacity: hook.enabled ? 1 : 0.5 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 13, color: "var(--pm-ink)", wordBreak: "break-all" }}>{hook.url}</div>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", marginTop: 4 }}>
                        {hook.enabled ? "enabled" : "disabled"} · added {new Date(hook.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <form action={toggleWebhook.bind(null, hook.id, !hook.enabled)}>
                        <button type="submit" className="pm-hoverable" style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", background: "none", border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)", padding: "6px 10px", cursor: "pointer" }}>
                          {hook.enabled ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteWebhook.bind(null, hook.id)}>
                        <ConfirmSubmitButton
                          confirmMessage={`Delete the webhook for ${hook.url}? It will stop receiving events immediately — this can't be undone.`}
                          className="pm-hoverable"
                          style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", background: "none", border: "1px solid var(--pm-hairline)", borderRadius: "var(--pm-r-image)", padding: "6px 10px", cursor: "pointer" }}
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                  {recent.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                      {recent.slice(0, 5).map((d, j) => (
                        <div key={j} style={{ fontFamily: MONO, fontSize: 12, color: "var(--pm-ash)", display: "flex", gap: 10 }}>
                          <span style={{ color: STATUS_COLOR[d.status] ?? "var(--pm-ash)", fontWeight: 600 }}>{d.status.toUpperCase()}</span>
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
