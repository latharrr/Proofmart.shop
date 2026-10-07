import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { formatAgo, formatDay, formatDayTime } from "@/components/account/format";
import { deleteWebhook, toggleWebhook } from "@/app/account/webhooks/actions";

export interface WebhookRow {
  id: string;
  url: string;
  enabled: boolean;
  created_at: string;
}

export interface DeliveryRow {
  webhook_endpoint_id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  created_at: string;
}

/**
 * Delivery outcomes, in words. A failed delivery is an error state, so it
 * takes the error colour the auth forms use for errors; everything else
 * stays achromatic — a successful delivery is not a verdict.
 */
function deliveryState(d: DeliveryRow): { label: string; glyph: string; tone?: "error" } {
  switch (d.status) {
    case "success":
      return { label: "Delivered", glyph: "✓" };
    case "pending":
      return d.attempt_count > 0 ? { label: "Retrying", glyph: "↻" } : { label: "Queued", glyph: "·" };
    case "exhausted":
      return { label: "Gave up", glyph: "×", tone: "error" };
    case "failed":
      return { label: "Failed", glyph: "×", tone: "error" };
    default:
      return { label: d.status, glyph: "·" };
  }
}

/** The last delivery, as the end of the sentence "Last delivery …". */
function lastSummary(d: DeliveryRow): string {
  switch (d.status) {
    case "success":
      return "succeeded";
    case "failed":
      return "failed";
    case "exhausted":
      return `failed after ${d.attempt_count} attempts`;
    case "pending":
      return d.attempt_count > 0 ? "retrying, first sent" : "queued";
    default:
      return d.status;
  }
}

/** The registered endpoints, each with its state, last delivery, controls and a disclosure of its five most recent deliveries. */
export default function WebhookList({ hooks, deliveriesByWebhook, now }: { hooks: WebhookRow[]; deliveriesByWebhook: Map<string, DeliveryRow[]>; now?: number }) {
  return (
    <ul className="pm-acct-rows pm-acct-hooks" data-testid="webhook-list">
      {hooks.map((hook) => {
        const recent = (deliveriesByWebhook.get(hook.id) ?? []).slice(0, 5);
        const last = recent[0];
        const lastState = last ? deliveryState(last) : null;
        return (
          <li key={hook.id} className="pm-acct-hook" data-enabled={hook.enabled ? "" : undefined} data-testid="webhook-row">
            <div className="pm-acct-hook-main">
              <span className="pm-acct-state" data-on={hook.enabled ? "" : undefined}>
                <span className="pm-acct-state-dot" aria-hidden="true" />
                {hook.enabled ? "Receiving events" : "Paused"}
              </span>
              <code className="pm-mono pm-acct-hook-url">{hook.url}</code>
              <p className="pm-acct-hook-meta">
                Added <time dateTime={hook.created_at}>{formatDay(hook.created_at)}</time>
                <span aria-hidden="true"> · </span>
                {last && lastState ? (
                  <span data-tone={lastState.tone}>
                    Last delivery {lastSummary(last)}{" "}
                    <time dateTime={last.created_at} title={formatDayTime(last.created_at)}>
                      {formatAgo(last.created_at, now)}
                    </time>
                  </span>
                ) : (
                  <span>No deliveries yet</span>
                )}
              </p>
            </div>

            <div className="pm-acct-hook-actions">
              <form action={toggleWebhook.bind(null, hook.id, !hook.enabled)}>
                <button type="submit" className="pm-app-chip" aria-label={`${hook.enabled ? "Pause" : "Resume"} deliveries to ${hook.url}`}>
                  {hook.enabled ? "Pause" : "Resume"}
                </button>
              </form>
              <form action={deleteWebhook.bind(null, hook.id)}>
                <ConfirmSubmitButton
                  confirmMessage={`Delete the webhook for ${hook.url}? It will stop receiving events immediately — this can't be undone.`}
                  className="pm-app-chip pm-app-chip-quiet"
                  aria-label={`Delete the endpoint ${hook.url}`}
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>

            {recent.length > 0 && (
              <details className="pm-acct-deliveries">
                <summary className="pm-acct-summary pm-acct-summary-sm">
                  <span>Recent deliveries</span>
                  <span className="pm-acct-summary-count">{recent.length}</span>
                </summary>
                <ul className="pm-acct-delivery-list">
                  {recent.map((d, j) => {
                    const st = deliveryState(d);
                    return (
                      <li key={j} className="pm-acct-delivery">
                        <span className="pm-acct-delivery-state" data-tone={st.tone}>
                          <span aria-hidden="true">{st.glyph}</span> {st.label}
                        </span>
                        <span className="pm-mono pm-acct-delivery-event">{d.event_type}</span>
                        <span className="pm-acct-delivery-meta">
                          {d.attempt_count} attempt{d.attempt_count === 1 ? "" : "s"}
                        </span>
                        <time className="pm-acct-delivery-meta" dateTime={d.created_at}>
                          {formatDayTime(d.created_at)}
                        </time>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
