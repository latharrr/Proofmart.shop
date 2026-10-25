import { redirect } from "next/navigation";
import { createClient, getVerifiedClaims, isSupabaseConfigured } from "@/lib/supabase/server";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import RollPill from "@/components/motion/roll-pill";
import Reveal from "@/components/motion/reveal";
import SigningGuide from "@/components/account/signing-guide";
import CreateWebhookForm from "./create-webhook-form";
import WebhookList, { type DeliveryRow, type WebhookRow } from "@/components/account/webhook-list";

/** Mirrors MAX_WEBHOOKS_PER_USER in ./actions.ts (a "use server" module can only export actions). */
const WEBHOOK_LIMIT = 10;

export default async function WebhooksPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await getVerifiedClaims(supabase);
  if (!data?.claims) redirect("/login");
  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  const { data: webhooks, error } = await supabase
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

  const hooks = webhooks ?? [];
  const enabledCount = hooks.filter((h) => h.enabled).length;

  return (
    <AppShell active="webhooks" email={email}>
      <AppPage>
        <AppPageHeader
          title="Webhooks"
          description={
            <>
              When a <code className="pm-acct-code-inline">/v1/verify</code> call made with one of your keys finishes, ProofMart POSTs the result to your
              endpoints — signed, so you can prove it came from us. No polling.
            </>
          }
          meta={
            hooks.length > 0 ? (
              <p className="pm-t-label pm-acct-meta">
                <span className="pm-acct-meta-item" data-on="">
                  {hooks.length} of {WEBHOOK_LIMIT} endpoints
                </span>
                {enabledCount < hooks.length && <span className="pm-acct-meta-item">{hooks.length - enabledCount} paused</span>}
              </p>
            ) : undefined
          }
        />

        <div className="pm-acct-grid">
          <div className="pm-acct-create-slot">
            <CreateWebhookForm used={hooks.length} limit={WEBHOOK_LIMIT} />
          </div>

          <SigningGuide />

          <Reveal as="section" delay={80} className="pm-acct-card pm-acct-list" aria-labelledby="pm-acct-hooks-title">
            <div className="pm-acct-section-head">
              <div className="pm-acct-section-title">
                <h2 id="pm-acct-hooks-title" className="pm-t-heading-sm">
                  Endpoints
                </h2>
                <span className="pm-t-mono pm-acct-count">{String(hooks.length).padStart(2, "0")}</span>
              </div>
            </div>

            {error ? (
              <div className="pm-acct-notice" role="alert">
                <p className="pm-acct-notice-title">Your endpoints couldn&apos;t be loaded.</p>
                <p className="pm-acct-hint">Deliveries are unaffected. This is a problem reaching storage; reload to try again.</p>
                <RollPill href="/account/webhooks" variant="secondary" size="sm">
                  Reload
                </RollPill>
              </div>
            ) : hooks.length > 0 ? (
              <WebhookList hooks={hooks} deliveriesByWebhook={deliveriesByWebhook} />
            ) : (
              <WebhooksEmpty />
            )}
          </Reveal>
        </div>
      </AppPage>
    </AppShell>
  );
}

function WebhooksEmpty() {
  const steps = [
    { t: "Add your URL above.", b: "Any public http(s) address on your server." },
    { t: "Save the signing secret.", b: "It's shown once, right after you add the endpoint." },
    {
      t: (
        <>
          Call <code className="pm-acct-code-inline">/v1/verify</code> with an API key.
        </>
      ),
      b: "The verdict is POSTed here as soon as it's ready.",
    },
  ];
  return (
    <div className="pm-acct-empty" data-testid="webhooks-empty">
      <p className="pm-acct-empty-title pm-acct-hint">No endpoints yet. Three steps to your first delivery:</p>
      <ol className="pm-acct-steps">
        {steps.map((s, i) => (
          <li key={i}>
            <span className="pm-t-mono pm-acct-step-n" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="pm-acct-step-t">{s.t}</span>
            <span className="pm-acct-hint">{s.b}</span>
          </li>
        ))}
      </ol>
      <RollPill href="/account/api-keys" variant="secondary" size="sm" dot>
        Get an API key
      </RollPill>
    </div>
  );
}
