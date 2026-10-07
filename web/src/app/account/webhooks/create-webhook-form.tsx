"use client";

import { useState, useTransition } from "react";
import RollPill from "@/components/motion/roll-pill";
import SecretReveal from "@/components/account/secret-reveal";
import { createWebhook } from "./actions";

const EVENTS = ["verification.completed", "verification.failed"];

// Same reasoning as the API key form: the signing secret is shown once,
// held only in local state, never put anywhere it could end up logged.
export default function CreateWebhookForm({ used, limit, initialSecret }: { used?: number; limit?: number; initialSecret?: string }) {
  const [url, setUrl] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(initialSecret ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (revealedSecret) {
    return (
      <SecretReveal title="Copy the signing secret now." secret={revealedSecret} secretLabel="Secret" envName="PROOFMART_WEBHOOK_SECRET" onDone={() => setRevealedSecret(null)}>
        Your endpoint is live. Every delivery carries an <code className="pm-acct-code-inline">x-proofmart-signature</code> header computed with this secret — check it before
        trusting the body. It&rsquo;s shown once; if it&rsquo;s lost, delete the endpoint and add it again for a new one.
      </SecretReveal>
    );
  }

  const full = typeof used === "number" && typeof limit === "number" && used >= limit;

  return (
    <form
      className="pm-acct-card pm-acct-create"
      aria-labelledby="pm-acct-create-title"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createWebhook(url);
          if ("error" in result) setError(result.error);
          else {
            setRevealedSecret(result.secret);
            setUrl("");
          }
        });
      }}
    >
      <div className="pm-acct-create-text">
        <p className="pm-t-label pm-acct-kicker">
          New endpoint
          {typeof used === "number" && typeof limit === "number" && (
            <span className="pm-t-mono pm-acct-kicker-count">
              {String(used).padStart(2, "0")} / {limit}
            </span>
          )}
        </p>
        <h2 id="pm-acct-create-title" className="pm-t-heading-sm pm-acct-create-title">
          Add an endpoint
        </h2>
        <p className="pm-acct-hint">
          A public URL on your server that accepts a JSON <code className="pm-acct-code-inline">POST</code> and answers with any 2xx within 10 seconds.
        </p>
      </div>
      <div className="pm-acct-create-row">
        <label className="pm-acct-field">
          <span className="pm-acct-sr">Endpoint URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/hooks"
            className="pm-acct-input pm-acct-input-mono"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "pm-acct-create-error pm-acct-events" : "pm-acct-events"}
          />
        </label>
        <RollPill type="submit" dot pending={pending} pendingLabel="Adding" className="pm-acct-create-submit">
          Add endpoint
        </RollPill>
      </div>
      <div className="pm-acct-events" id="pm-acct-events">
        <span className="pm-t-label pm-acct-events-label">Sends</span>
        <ul className="pm-acct-event-list" aria-label="Events sent to every endpoint">
          {EVENTS.map((ev) => (
            <li key={ev} className="pm-t-mono pm-acct-event">
              <span className="pm-acct-event-dot" aria-hidden="true" />
              {ev}
            </li>
          ))}
        </ul>
        <span className="pm-acct-hint pm-acct-events-note">
          Every endpoint receives both. Branch on the <code className="pm-acct-code-inline">x-proofmart-event</code> header.
        </span>
      </div>
      {error && (
        <p id="pm-acct-create-error" role="alert" className="pm-acct-error">
          {error}
        </p>
      )}
      {full && !error && <p className="pm-acct-hint">You&apos;ve reached the limit of {limit} endpoints. Delete one to add another.</p>}
    </form>
  );
}
