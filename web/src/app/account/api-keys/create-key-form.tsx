"use client";

import { useState, useTransition } from "react";
import * as s from "@/components/auth/auth-styles";
import { MONO } from "@/lib/evidence-data";
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
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (revealedKey) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={s.successBanner}>Copy this key now — it won&rsquo;t be shown again.</div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 13,
            padding: "10px 12px",
            border: "1px solid var(--pm-hairline)",
            borderRadius: "var(--pm-r-image)",
            background: "var(--pm-mist)",
            wordBreak: "break-all",
          }}
        >
          {revealedKey}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="pm-btn pm-btn-ghost"
            style={{ ...s.secondaryButton, width: "auto" }}
            onClick={async () => {
              await navigator.clipboard.writeText(revealedKey);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            className="pm-btn pm-btn-filled"
            style={{ ...s.primaryButton, width: "auto" }}
            onClick={() => setRevealedKey(null)}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      style={{ display: "flex", gap: 10 }}
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
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key name (e.g. production)"
        style={{ ...s.input, flex: 1 }}
      />
      <button type="submit" disabled={pending} className="pm-btn pm-btn-filled" style={{ ...s.primaryButton, width: "auto" }}>
        {pending ? "Creating…" : "Create key"}
      </button>
      {error && <div style={s.errorBanner}>{error}</div>}
    </form>
  );
}
