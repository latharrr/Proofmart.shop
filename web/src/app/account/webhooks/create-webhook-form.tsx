"use client";

import { useState, useTransition } from "react";
import SecretReveal from "@/components/account/secret-reveal";
import { createWebhook } from "./actions";

const EVENTS = ["verification.completed", "verification.failed"];

// Same reasoning as the API key form: the signing secret is shown once,
// held only in local state, never put anywhere it could end up logged.
export default function CreateWebhookForm({ used, limit }: { used?: number; limit?: number }) {
  const [url, setUrl] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (revealedSecret) {
    return (
      <SecretReveal title="Copy the signing secret now" secret={revealedSecret} secretLabel="Secret" envName="PROOFMART_WEBHOOK_SECRET" onDone={() => setRevealedSecret(null)}>
        Your endpoint is live. Every delivery carries an <code className="pm-mono">x-proofmart-signature</code> header computed with this secret — check it before
        trusting the body. It&rsquo;s shown once; if it&rsquo;s lost, delete the endpoint and add it again for a new one.
      </SecretReveal>
    );
  }

  const full = typeof used === "number" && typeof limit === "number" && used >= limit;

  return (
    <form
      className="pm-acct-create"
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
        <h2 id="pm-acct-create-title" className="pm-acct-create-title">
          Add an endpoint
        </h2>
        <p className="pm-acct-create-hint">
          A public URL on your server that accepts a JSON <span className="pm-mono">POST</span> and answers with any 2xx within 10 seconds.
        </p>
      </div>
      <div className="pm-acct-create-row">
        <label className="pm-acct-field">
          <span className="pm-acct-label">Endpoint URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/hooks"
            className="pm-acct-input"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "pm-acct-create-error pm-acct-events" : "pm-acct-events"}
          />
        </label>
        <button type="submit" disabled={pending} data-pending={pending ? "" : undefined} className="pm-btn pm-btn-filled pm-acct-create-submit">
          {pending ? "Adding…" : "Add endpoint"}
        </button>
      </div>
      <div className="pm-acct-events" id="pm-acct-events">
        <span className="pm-acct-label">Events</span>
        <ul className="pm-acct-event-list" aria-label="Events sent to every endpoint">
          {EVENTS.map((ev) => (
            <li key={ev} className="pm-mono pm-acct-event">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {ev}
            </li>
          ))}
        </ul>
        <span className="pm-acct-events-note">Every endpoint receives both. Branch on the <span className="pm-mono">x-proofmart-event</span> header.</span>
      </div>
      {error && (
        <p id="pm-acct-create-error" role="alert" className="pm-acct-error">
          {error}
        </p>
      )}
      {full && !error && <p className="pm-acct-create-hint">You&apos;ve reached the limit of {limit} endpoints. Delete one to add another.</p>}
    </form>
  );
}
