import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import CodeCard from "@/components/account/code-card";
import { formatAgo, formatDay } from "@/components/account/format";
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

const PAGE_SIZE = 25;
const REVOKED_SHOWN = 20;
/** Past this many active keys the list gets a name filter. */
const SEARCH_THRESHOLD = 8;

const COLUMNS = "id, name, key_prefix, created_at, last_used_at, revoked_at";

/** `%` and `_` are ILIKE wildcards; a name filter should match them literally. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

function keysHref(params: { page?: number; q?: string }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `/account/api-keys?${s}` : "/account/api-keys";
}

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  const { page: pageParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const q = (qParam ?? "").trim().slice(0, 80);
  const from = (page - 1) * PAGE_SIZE;

  let activeQuery = supabase.from("api_keys").select(COLUMNS, { count: "exact" }).is("revoked_at", null);
  if (q) activeQuery = activeQuery.ilike("name", likePattern(q));

  const [active, revoked, allActive] = await Promise.all([
    activeQuery
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
      .returns<ApiKeyRow[]>(),
    supabase
      .from("api_keys")
      .select(COLUMNS, { count: "exact" })
      .not("revoked_at", "is", null)
      .order("revoked_at", { ascending: false })
      .limit(REVOKED_SHOWN)
      .returns<ApiKeyRow[]>(),
    // The unfiltered total, for the header and for deciding whether to offer the filter at all.
    q ? supabase.from("api_keys").select("id", { count: "exact", head: true }).is("revoked_at", null) : null,
  ]);

  const keys = active.data ?? [];
  const matchCount = active.count ?? 0;
  const activeTotal = q ? (allActive?.count ?? 0) : matchCount;
  const revokedKeys = revoked.data ?? [];
  const revokedTotal = revoked.count ?? 0;
  const hasMore = matchCount > from + PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(matchCount / PAGE_SIZE));
  const showSearch = activeTotal > SEARCH_THRESHOLD || Boolean(q);

  return (
    <AppShell active="api-keys" email={email}>
      <AppPage>
        <AppPageHeader
          title="API keys"
          description={
            <>
              Keys authenticate your calls to <code className="pm-acct-code-inline">/v1/verify</code>, <code className="pm-acct-code-inline">/v1/inspect</code> and{" "}
              <code className="pm-acct-code-inline">/v1/extract</code>. Treat each one like a password: keep it on your server, never in a browser or an app.
            </>
          }
          meta={
            activeTotal + revokedTotal > 0 ? (
              <p className="pm-app-count">
                {activeTotal} active{revokedTotal > 0 ? ` · ${revokedTotal} revoked` : ""}
              </p>
            ) : undefined
          }
        />

        <div className="pm-acct-layout">
          <div className="pm-acct-main">
            <CreateKeyForm />

            <section className="pm-acct-section" aria-labelledby="pm-acct-keys-title">
              <div className="pm-acct-section-head">
                <h2 id="pm-acct-keys-title" className="pm-acct-h2">
                  Active keys
                </h2>
                {showSearch && (
                  <form method="get" action="/account/api-keys" className="pm-acct-search" role="search">
                    <label className="pm-acct-sr" htmlFor="pm-acct-q">
                      Filter keys by name
                    </label>
                    <input id="pm-acct-q" name="q" type="search" defaultValue={q} placeholder="Filter by name" className="pm-acct-input pm-acct-search-input" autoComplete="off" />
                    <button type="submit" className="pm-app-chip">
                      Filter
                    </button>
                  </form>
                )}
              </div>

              {q && (
                <p className="pm-acct-filter-note" aria-live="polite">
                  {matchCount} {matchCount === 1 ? "key" : "keys"} named like &ldquo;{q}&rdquo;.{" "}
                  <Link href="/account/api-keys" className="pm-link">
                    Show all
                  </Link>
                </p>
              )}

              {active.error ? (
                <div className="pm-app-notice" role="alert">
                  <p className="pm-app-notice-title">Your keys couldn&apos;t be loaded.</p>
                  <p className="pm-app-notice-body">Nothing has changed — every key still works. This is a problem reaching storage; reload to try again.</p>
                  <Link href={keysHref({ page, q })} className="pm-btn pm-btn-ghost pm-btn-sm">
                    Reload
                  </Link>
                </div>
              ) : keys.length > 0 ? (
                <div className="pm-acct-table" data-testid="api-key-list">
                  <div className="pm-acct-thead pm-acct-keyrow" aria-hidden="true">
                    <span>Name and key</span>
                    <span>Created</span>
                    <span>Last used</span>
                    <span />
                  </div>
                  <ul className="pm-acct-rows">
                    {keys.map((key) => (
                      <li key={key.id} className="pm-acct-row pm-acct-keyrow" data-testid="api-key-row">
                        <span className="pm-acct-key-id">
                          <span className="pm-acct-key-name">{key.name}</span>
                          <span className="pm-mono pm-acct-key-prefix" aria-label={`Key starting ${key.key_prefix}`}>
                            {key.key_prefix}…
                          </span>
                        </span>
                        <span className="pm-acct-cell">
                          <span className="pm-acct-cell-label">Created </span>
                          <time dateTime={key.created_at}>{formatDay(key.created_at)}</time>
                        </span>
                        <span className="pm-acct-cell" data-quiet={key.last_used_at ? undefined : ""}>
                          <span className="pm-acct-cell-label">Last used </span>
                          {key.last_used_at ? (
                            <time dateTime={key.last_used_at} title={formatDay(key.last_used_at)}>
                              {formatAgo(key.last_used_at)}
                            </time>
                          ) : (
                            "Never"
                          )}
                        </span>
                        <form action={revokeApiKey.bind(null, key.id)} className="pm-acct-row-action">
                          <ConfirmSubmitButton
                            confirmMessage={`Revoke "${key.name}"? Anything using this key will stop working immediately — this can't be undone.`}
                            className="pm-app-chip pm-app-chip-quiet"
                            aria-label={`Revoke ${key.name} (${key.key_prefix}…)`}
                          >
                            Revoke
                          </ConfirmSubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : q ? (
                <div className="pm-app-notice">
                  <p className="pm-app-notice-title">No active key is named like &ldquo;{q}&rdquo;.</p>
                  <p className="pm-app-notice-body">The filter matches any part of a key&apos;s name. Revoked keys are listed separately below.</p>
                  <Link href="/account/api-keys" className="pm-btn pm-btn-ghost pm-btn-sm">
                    Show all keys
                  </Link>
                </div>
              ) : page > 1 ? (
                <div className="pm-app-notice">
                  <p className="pm-app-notice-title">There&apos;s nothing on page {page}.</p>
                  <p className="pm-app-notice-body">The keys that were here may have been revoked.</p>
                  <Link href="/account/api-keys" className="pm-btn pm-btn-ghost pm-btn-sm">
                    Back to the newest
                  </Link>
                </div>
              ) : (
                <div className="pm-acct-empty" data-testid="api-keys-empty">
                  <p className="pm-acct-empty-title">{revokedTotal > 0 ? "No active keys." : "No keys yet."}</p>
                  <p className="pm-acct-empty-body">
                    {revokedTotal > 0
                      ? "Every key you've made has been revoked, so nothing can call the API as you right now. Create a key above to start again."
                      : "Create one above, then send it as a Bearer token. One key per environment — production, staging, CI — means you can revoke one without breaking the others."}
                  </p>
                </div>
              )}

              {(page > 1 || hasMore) && keys.length > 0 && (
                <nav className="pm-pager" aria-label="Pages">
                  {page > 1 ? (
                    <Link href={keysHref({ page: page - 1, q })} className="pm-app-chip" rel="prev">
                      ← Newer
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="pm-pager-pos">
                    Page {page} of {totalPages}
                  </span>
                  {hasMore ? (
                    <Link href={keysHref({ page: page + 1, q })} className="pm-app-chip" rel="next">
                      Older →
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </section>

            {revokedTotal > 0 && (
              <details className="pm-acct-details">
                <summary className="pm-acct-summary">
                  <span>Revoked keys</span>
                  <span className="pm-acct-summary-count">{revokedTotal}</span>
                </summary>
                <p className="pm-acct-details-note">
                  Revoked keys are refused with <code className="pm-acct-code-inline">401 revoked_api_key</code>. They stay listed so you can tell which key a failing integration was using.
                </p>
                <ul className="pm-acct-rows">
                  {revokedKeys.map((key) => (
                    <li key={key.id} className="pm-acct-row pm-acct-keyrow" data-revoked="">
                      <span className="pm-acct-key-id">
                        <span className="pm-acct-key-name">{key.name}</span>
                        <span className="pm-mono pm-acct-key-prefix">{key.key_prefix}…</span>
                      </span>
                      <span className="pm-acct-cell">
                        <span className="pm-acct-cell-label">Created </span>
                        <time dateTime={key.created_at}>{formatDay(key.created_at)}</time>
                      </span>
                      <span className="pm-acct-cell">
                        <span className="pm-acct-cell-label">Last used </span>
                        {key.last_used_at ? <time dateTime={key.last_used_at}>{formatDay(key.last_used_at)}</time> : "Never"}
                      </span>
                      <span className="pm-acct-cell pm-acct-row-action">
                        Revoked <time dateTime={key.revoked_at ?? undefined}>{key.revoked_at ? formatDay(key.revoked_at) : ""}</time>
                      </span>
                    </li>
                  ))}
                </ul>
                {revokedTotal > revokedKeys.length && <p className="pm-acct-details-note">Showing the {revokedKeys.length} most recently revoked.</p>}
              </details>
            )}
          </div>

          <aside className="pm-acct-aside" aria-labelledby="pm-acct-quick-title">
            <h2 id="pm-acct-quick-title" className="pm-acct-h2">
              Make your first call
            </h2>
            <p className="pm-acct-aside-body">Put the key in an environment variable, then POST a PDF as multipart form data. The verdict comes back in the response.</p>
            <CodeCard
              label="terminal"
              note="PDF up to 20 MB"
              lines={[
                { text: "curl https://proofmart.shop/v1/verify \\" },
                { indent: 2, text: '-H "Authorization: Bearer $PROOFMART_API_KEY" \\' },
                { indent: 2, text: '-F "file=@statement.pdf"' },
              ]}
            />

            <ul className="pm-acct-defs" aria-label="Endpoints this key can call">
              <li>
                <code className="pm-acct-code-inline">/v1/verify</code>
                <span>Every marker, one FAIL, REVIEW or CLEAR verdict. Triggers your webhooks.</span>
              </li>
              <li>
                <code className="pm-acct-code-inline">/v1/extract</code>
                <span>Positioned text, tables and OCR, without a verdict.</span>
              </li>
              <li>
                <code className="pm-acct-code-inline">/v1/inspect</code>
                <span>The fastest call: PDF type, page count, confidence.</span>
              </li>
            </ul>

            <div className="pm-acct-aside-links">
              <Link href="/account/billing" className="pm-link">
                Calls count toward your monthly quota
                <span className="pm-arrow" aria-hidden="true">
                  <span>→</span>
                </span>
              </Link>
              <Link href="/account/webhooks" className="pm-link">
                Get verdicts pushed to your server
                <span className="pm-arrow" aria-hidden="true">
                  <span>→</span>
                </span>
              </Link>
            </div>
          </aside>
        </div>
      </AppPage>
    </AppShell>
  );
}
