"use client";

import { useState, useTransition } from "react";
import SecretReveal from "@/components/account/secret-reveal";
import { createApiKey } from "./actions";

// Client component, not a plain <form action>, because the raw key has to
// be shown once and only once — it never gets stored, so it can't be read
// back from a redirect/revalidated list the way every other form on this
// site works. Kept in local state only; never put in a URL, so it can't
// end up in browser history or server access logs.
export default function CreateKeyForm() {
  const [name, setName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (revealedKey) {
    return (
      <SecretReveal title="Copy your new key now" secret={revealedKey} secretLabel="Key" envName="PROOFMART_API_KEY" onDone={() => setRevealedKey(null)}>
        This is the only time the full key is shown. ProofMart keeps a one-way hash, not the key, so it can&rsquo;t be recovered later. If it&rsquo;s lost,
        revoke it and create another.
      </SecretReveal>
    );
  }

  return (
    <form
      className="pm-acct-create"
      aria-labelledby="pm-acct-create-title"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createApiKey(name);
          if ("error" in result) setError(result.error);
          else {
            setRevealedKey(result.rawKey);
            setName("");
          }
        });
      }}
    >
      <div className="pm-acct-create-text">
        <h2 id="pm-acct-create-title" className="pm-acct-create-title">
          Create a key
        </h2>
        <p className="pm-acct-create-hint">Name it after where it will run, so you know what stops working if you ever revoke it.</p>
      </div>
      <div className="pm-acct-create-row">
        <label className="pm-acct-field">
          <span className="pm-acct-label">Key name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. production, staging, ci"
            className="pm-acct-input"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "pm-acct-create-error" : undefined}
          />
        </label>
        <button type="submit" disabled={pending} data-pending={pending ? "" : undefined} className="pm-btn pm-btn-filled pm-acct-create-submit">
          {pending ? "Creating…" : "Create key"}
        </button>
      </div>
      {error && (
        <p id="pm-acct-create-error" role="alert" className="pm-acct-error">
          {error}
        </p>
      )}
    </form>
  );
}
