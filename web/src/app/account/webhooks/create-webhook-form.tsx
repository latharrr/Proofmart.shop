"use client";

import { useState, useTransition } from "react";
import * as s from "@/components/auth/auth-styles";
import { MONO } from "@/lib/evidence-data";
import { createWebhook } from "./actions";

// Same reasoning as the API key form: the signing secret is shown once,
// held only in local state, never put anywhere it could end up logged.
export default function CreateWebhookForm() {
  const [url, setUrl] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (revealedSecret) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={s.successBanner}>Copy this signing secret now — it won&rsquo;t be shown again. Use it to verify the x-proofmart-signature header on deliveries.</div>
        <div style={{ fontFamily: MONO, fontSize: 13, padding: "10px 12px", border: "1px solid #DDE1E4", borderRadius: 3, background: "#EDEFF1", wordBreak: "break-all" }}>
          {revealedSecret}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="pm-hoverable"
            style={{ ...s.secondaryButton, width: "auto", padding: "8px 14px" }}
            onClick={async () => {
              await navigator.clipboard.writeText(revealedSecret);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="pm-hoverable" style={{ ...s.primaryButton, width: "auto", padding: "8px 14px" }} onClick={() => setRevealedSecret(null)}>
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
          const result = await createWebhook(url);
          if ("error" in result) setError(result.error);
          else {
            setRevealedSecret(result.secret);
            setUrl("");
          }
        });
      }}
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://your-server.example.com/webhooks/proofmart"
        style={{ ...s.input, flex: 1 }}
      />
      <button type="submit" disabled={pending} className="pm-hoverable" style={{ ...s.primaryButton, width: "auto", padding: "10px 16px" }}>
        {pending ? "Adding…" : "Add webhook"}
      </button>
      {error && <div style={s.errorBanner}>{error}</div>}
    </form>
  );
}
