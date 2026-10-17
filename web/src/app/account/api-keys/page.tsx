import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";
import RollPill from "@/components/motion/roll-pill";
import Reveal from "@/components/motion/reveal";
import FirstCall from "@/components/account/first-call";
import { KeyList, RevokedKeys, type ApiKeyRow } from "@/components/account/key-list";
import CreateKeyForm from "./create-key-form";
import { revokeApiKey } from "./actions";

const PAGE_SIZE = 25;
const REVOKED_SHOWN = 20;
/** Past this many active keys the list gets a name filter. */
const SEARCH_THRESHOLD = 8;

const COLUMNS = "id, name, key_prefix, created_at, last_used_at, revoked_at";

/** `%` and `_` are ILIKE wildcards; a name filter should match them literally. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

/** Read outside the component body: render must stay pure, and a server render happens once per request anyway. */
function requestTime(): number {
  return Date.now();
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
              <p className="pm-t-label pm-acct-meta">
                <span className="pm-acct-meta-item" data-on="">
                  {activeTotal} active
                </span>
                {revokedTotal > 0 && <span className="pm-acct-meta-item">{revokedTotal} revoked</span>}
              </p>
            ) : undefined
          }
        />

        <div className="pm-acct-grid">
          <div className="pm-acct-create-slot">
            <CreateKeyForm />
          </div>

          <FirstCall />

          <Reveal as="section" delay={80} className="pm-acct-card pm-acct-list" aria-labelledby="pm-acct-keys-title">
            <div className="pm-acct-section-head">
              <div className="pm-acct-section-title">
                <h2 id="pm-acct-keys-title" className="pm-t-heading-sm">
                  Active keys
                </h2>
                <span className="pm-t-mono pm-acct-count">{String(q ? matchCount : activeTotal).padStart(2, "0")}</span>
              </div>
              {showSearch && (
                <form method="get" action="/account/api-keys" className="pm-acct-search" role="search">
                  <label className="pm-acct-sr" htmlFor="pm-acct-q">
                    Filter keys by name
                  </label>
                  <svg className="pm-acct-search-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input id="pm-acct-q" name="q" type="search" defaultValue={q} placeholder="Filter by name" className="pm-acct-input pm-acct-search-input" autoComplete="off" />
                  <RollPill type="submit" variant="secondary" size="sm">
                    Filter
                  </RollPill>
                </form>
              )}
            </div>

            {q && (
              <p className="pm-acct-filter-note" aria-live="polite">
                {matchCount} {matchCount === 1 ? "key" : "keys"} named like &ldquo;{q}&rdquo;.{" "}
                <Link href="/account/api-keys" className="pm-inline-link">
                  Show all
                </Link>
              </p>
            )}

            {active.error ? (
              <div className="pm-acct-notice" role="alert">
                <p className="pm-acct-notice-title">Your keys couldn&apos;t be loaded.</p>
                <p className="pm-acct-hint">Nothing has changed — every key still works. This is a problem reaching storage; reload to try again.</p>
                <RollPill href={keysHref({ page, q })} variant="secondary" size="sm">
                  Reload
                </RollPill>
              </div>
            ) : keys.length > 0 ? (
              <KeyList keys={keys} offset={from} revoke={revokeApiKey} now={requestTime()} />
            ) : q ? (
              <div className="pm-acct-notice">
                <p className="pm-acct-notice-title">No active key is named like &ldquo;{q}&rdquo;.</p>
                <p className="pm-acct-hint">The filter matches any part of a key&apos;s name. Revoked keys are listed separately below.</p>
                <RollPill href="/account/api-keys" variant="secondary" size="sm">
                  Show all keys
                </RollPill>
              </div>
            ) : page > 1 ? (
              <div className="pm-acct-notice">
                <p className="pm-acct-notice-title">There&apos;s nothing on page {page}.</p>
                <p className="pm-acct-hint">The keys that were here may have been revoked.</p>
                <RollPill href="/account/api-keys" variant="secondary" size="sm">
                  Back to the newest
                </RollPill>
              </div>
            ) : (
              <div className="pm-acct-empty" data-testid="api-keys-empty">
                <p className="pm-t-heading-sm pm-acct-empty-title">{revokedTotal > 0 ? "No active keys." : "No keys yet."}</p>
                <p className="pm-acct-hint">
                  {revokedTotal > 0
                    ? "Every key you've made has been revoked, so nothing can call the API as you right now. Create a key above to start again."
                    : "Create one above, then send it as a Bearer token. One key per environment — production, staging, CI — means you can revoke one without breaking the others."}
                </p>
              </div>
            )}

            {(page > 1 || hasMore) && keys.length > 0 && (
              <nav className="pm-acct-pager" aria-label="Pages">
                {page > 1 ? (
                  <RollPill href={keysHref({ page: page - 1, q })} variant="secondary" size="sm" rel="prev">
                    Newer
                  </RollPill>
                ) : (
                  <span />
                )}
                <span className="pm-t-mono pm-acct-pager-pos">
                  {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                </span>
                {hasMore ? (
                  <RollPill href={keysHref({ page: page + 1, q })} variant="secondary" size="sm" dot rel="next">
                    Older
                  </RollPill>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </Reveal>

          {revokedTotal > 0 && (
            <div className="pm-acct-revoked-slot">
              <RevokedKeys keys={revokedKeys} total={revokedTotal} />
            </div>
          )}
        </div>
      </AppPage>
    </AppShell>
  );
}
