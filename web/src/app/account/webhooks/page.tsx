import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import CodeCard from "@/components/account/code-card";
import CreateWebhookForm from "./create-webhook-form";
import WebhookList, { type DeliveryRow, type WebhookRow } from "@/components/account/webhook-list";

/** Mirrors MAX_WEBHOOKS_PER_USER in ./actions.ts (a "use server" module can only export actions). */
const WEBHOOK_LIMIT = 10;

export default async function WebhooksPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
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
              <p className="pm-app-count">
                {hooks.length} of {WEBHOOK_LIMIT} endpoints{enabledCount < hooks.length ? ` · ${hooks.length - enabledCount} paused` : ""}
              </p>
            ) : undefined
          }
        />

        <div className="pm-acct-layout">
          <div className="pm-acct-main">
            <CreateWebhookForm used={hooks.length} limit={WEBHOOK_LIMIT} />

            <section className="pm-acct-section" aria-labelledby="pm-acct-hooks-title">
              <div className="pm-acct-section-head">
                <h2 id="pm-acct-hooks-title" className="pm-acct-h2">
                  Endpoints
                </h2>
              </div>

              {error ? (
                <div className="pm-app-notice" role="alert">
                  <p className="pm-app-notice-title">Your endpoints couldn&apos;t be loaded.</p>
                  <p className="pm-app-notice-body">Deliveries are unaffected. This is a problem reaching storage; reload to try again.</p>
                  <Link href="/account/webhooks" className="pm-btn pm-btn-ghost pm-btn-sm">
                    Reload
                  </Link>
                </div>
              ) : hooks.length > 0 ? (
                <WebhookList hooks={hooks} deliveriesByWebhook={deliveriesByWebhook} />
              ) : (
                <div className="pm-acct-empty" data-testid="webhooks-empty">
                  <p className="pm-acct-empty-title">No endpoints yet.</p>
                  <ol className="pm-acct-steps">
                    <li>
                      <span className="pm-acct-step-n" aria-hidden="true">
                        1
                      </span>
                      <span>
                        <strong>Add your URL above.</strong> Any public http(s) address on your server.
                      </span>
                    </li>
                    <li>
                      <span className="pm-acct-step-n" aria-hidden="true">
                        2
                      </span>
                      <span>
                        <strong>Save the signing secret.</strong> It&apos;s shown once, right after you add the endpoint.
                      </span>
                    </li>
                    <li>
                      <span className="pm-acct-step-n" aria-hidden="true">
                        3
                      </span>
                      <span>
                        <strong>Call <code className="pm-acct-code-inline">/v1/verify</code> with an API key.</strong> The verdict is POSTed here as soon as it&apos;s
                        ready.
                      </span>
                    </li>
                  </ol>
                  <Link href="/account/api-keys" className="pm-link">
                    Get an API key
                    <span className="pm-arrow" aria-hidden="true">
                      <span>→</span>
                    </span>
                  </Link>
                </div>
              )}
            </section>
          </div>

          <aside className="pm-acct-aside" aria-labelledby="pm-acct-sign-title">
            <h2 id="pm-acct-sign-title" className="pm-acct-h2">
              Verifying a delivery
            </h2>
            <p className="pm-acct-aside-body">
              Recompute the HMAC-SHA256 of the raw request body with your endpoint&apos;s secret and compare it to the header. Hash the bytes as received, before
              any JSON parsing.
            </p>
            <CodeCard
              label="verify-webhook.js"
              note="Node"
              lines={[
                { text: "import { createHmac, timingSafeEqual }" },
                { indent: 2, text: 'from "node:crypto";' },
                { text: "" },
                { text: "function isFromProofMart(rawBody, signature) {" },
                { indent: 2, text: 'const expected = "sha256=" + createHmac("sha256",' },
                { indent: 4, text: "process.env.PROOFMART_WEBHOOK_SECRET)" },
                { indent: 4, text: '.update(rawBody).digest("hex");' },
                { indent: 2, text: "const a = Buffer.from(expected);" },
                { indent: 2, text: 'const b = Buffer.from(signature ?? "");' },
                { indent: 2, text: "return a.length === b.length &&" },
                { indent: 4, text: "timingSafeEqual(a, b);" },
                { text: "}" },
              ]}
            />

            <ul className="pm-acct-defs" aria-label="Headers on every delivery">
              <li>
                <code className="pm-acct-code-inline">x-proofmart-signature</code>
                <span>
                  <span className="pm-mono">sha256=</span> followed by the hex HMAC of the body.
                </span>
              </li>
              <li>
                <code className="pm-acct-code-inline">x-proofmart-event</code>
                <span>Which event this is, completed or failed.</span>
              </li>
              <li>
                <code className="pm-acct-code-inline">x-proofmart-delivery</code>
                <span>Unique per delivery. Store it to ignore a retry you&apos;ve already handled.</span>
              </li>
            </ul>

            <dl className="pm-acct-facts">
              <div>
                <dt>Where&apos;s the secret?</dt>
                <dd>Shown once, when you add the endpoint. ProofMart can&apos;t display it again; if it&apos;s lost, delete the endpoint and add it back.</dd>
              </div>
              <div>
                <dt>Retries</dt>
                <dd>Anything but a 2xx within 10 seconds is retried 5 times over about 13 hours, then marked as given up. A paused endpoint receives nothing, and events aren&apos;t saved up for it.</dd>
              </div>
            </dl>
          </aside>
        </div>
      </AppPage>
    </AppShell>
  );
}
