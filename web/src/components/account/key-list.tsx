import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { formatAgo, formatDay } from "./format";
import PillLabel from "./pill-label";

export interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const RECENT_MS = 30 * 24 * 60 * 60 * 1000;

/** In use = called in the last 30 days; idle = called before that; never = never called. */
function usage(key: ApiKeyRow, now: number): "recent" | "idle" | "never" {
  if (!key.last_used_at) return "never";
  return now - new Date(key.last_used_at).getTime() < RECENT_MS ? "recent" : "idle";
}

/**
 * The active keys as a numbered ledger: index, name over its mono prefix,
 * created, last used (with an in-use dot), and a revoke pill behind a
 * confirm(). Numbering continues across pages so "key 31" means the same
 * row on every visit.
 */
export function KeyList({
  keys,
  offset = 0,
  revoke,
  now = Date.now(),
}: {
  keys: ApiKeyRow[];
  offset?: number;
  revoke: (id: string) => Promise<void>;
  now?: number;
}) {
  return (
    <div className="pm-acct-table" data-testid="api-key-list">
      <div className="pm-acct-thead pm-acct-keyrow pm-t-label" aria-hidden="true">
        <span>#</span>
        <span>Name and key</span>
        <span>Created</span>
        <span>Last used</span>
        <span />
      </div>
      <ul className="pm-acct-rows">
        {keys.map((key, i) => {
          const state = usage(key, now);
          return (
            <li key={key.id} className="pm-acct-row pm-acct-keyrow" data-testid="api-key-row">
              <span className="pm-t-mono pm-acct-idx" aria-hidden="true">
                {String(offset + i + 1).padStart(2, "0")}
              </span>
              <span className="pm-acct-key-id">
                <span className="pm-acct-key-name">{key.name}</span>
                <span className="pm-t-mono pm-acct-key-prefix" aria-label={`Key starting ${key.key_prefix}`}>
                  {key.key_prefix}
                  <span aria-hidden="true">••••</span>
                </span>
              </span>
              <span className="pm-acct-cell">
                <span className="pm-acct-cell-label">Created </span>
                <time dateTime={key.created_at}>{formatDay(key.created_at)}</time>
              </span>
              <span className="pm-acct-cell pm-acct-used" data-state={state}>
                <span className="pm-acct-used-dot" aria-hidden="true" />
                <span className="pm-acct-cell-label">Last used </span>
                {key.last_used_at ? (
                  <time dateTime={key.last_used_at} title={formatDay(key.last_used_at)}>
                    {formatAgo(key.last_used_at, now)}
                  </time>
                ) : (
                  "Never"
                )}
              </span>
              <form action={revoke.bind(null, key.id)} className="pm-acct-row-action">
                <ConfirmSubmitButton
                  confirmMessage={`Revoke "${key.name}"? Anything using this key will stop working immediately — this can't be undone.`}
                  className="pm-pill pm-acct-danger"
                  data-variant="secondary"
                  data-size="sm"
                  aria-label={`Revoke ${key.name} (${key.key_prefix}…)`}
                >
                  <PillLabel>Revoke</PillLabel>
                </ConfirmSubmitButton>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Revoked keys, read-only, in a disclosure. */
export function RevokedKeys({ keys, total }: { keys: ApiKeyRow[]; total: number }) {
  return (
    <details className="pm-acct-card pm-acct-details">
      <summary className="pm-acct-summary">
        <span className="pm-t-heading-sm">Revoked keys</span>
        <span className="pm-t-mono pm-acct-summary-count">{String(total).padStart(2, "0")}</span>
        <span className="pm-acct-summary-mark" aria-hidden="true" />
      </summary>
      <p className="pm-acct-hint pm-acct-details-note">
        Revoked keys are refused with <code className="pm-acct-code-inline">401 revoked_api_key</code>. They stay listed so you can tell which key a failing
        integration was using.
      </p>
      <ul className="pm-acct-rows">
        {keys.map((key) => (
          <li key={key.id} className="pm-acct-row pm-acct-keyrow" data-revoked="">
            <span className="pm-t-mono pm-acct-idx" aria-hidden="true">
              —
            </span>
            <span className="pm-acct-key-id">
              <span className="pm-acct-key-name">{key.name}</span>
              <span className="pm-t-mono pm-acct-key-prefix">
                {key.key_prefix}
                <span aria-hidden="true">••••</span>
              </span>
            </span>
            <span className="pm-acct-cell">
              <span className="pm-acct-cell-label">Created </span>
              <time dateTime={key.created_at}>{formatDay(key.created_at)}</time>
            </span>
            <span className="pm-acct-cell">
              <span className="pm-acct-cell-label">Last used </span>
              {key.last_used_at ? <time dateTime={key.last_used_at}>{formatDay(key.last_used_at)}</time> : "Never"}
            </span>
            <span className="pm-acct-cell pm-acct-row-action pm-acct-revoked-at">
              Revoked <time dateTime={key.revoked_at ?? undefined}>{key.revoked_at ? formatDay(key.revoked_at) : ""}</time>
            </span>
          </li>
        ))}
      </ul>
      {total > keys.length && <p className="pm-acct-hint pm-acct-details-note">Showing the {keys.length} most recently revoked.</p>}
    </details>
  );
}
