import CodeCard from "./code-card";
import DepthStage from "./depth-stage";

/**
 * "How signing works": a delivery as it arrives (headers and body on the
 * graphite stage) with your server's check floating in front of it — the
 * HMAC you compute, equal to the header you received. Then the code that
 * does it, ready to paste.
 */
export default function SigningGuide() {
  return (
    <aside className="pm-acct-aside" aria-labelledby="pm-acct-sign-title">
      <div className="pm-acct-aside-head">
        <p className="pm-t-label pm-acct-kicker">Signing</p>
        <h2 id="pm-acct-sign-title" className="pm-t-heading-sm">
          Verifying a delivery
        </h2>
        <p className="pm-acct-hint">
          Recompute the HMAC-SHA256 of the raw request body with your endpoint&apos;s secret and compare it to the header. Hash the bytes as received, before any
          JSON parsing.
        </p>
      </div>

      <DepthStage
        label="POST → your endpoint"
        floatLabel="your server checks"
        float={
          <div className="pm-acct-resp pm-acct-sigcheck" aria-label="The check your server makes">
            <p className="pm-t-mono pm-acct-sig-row">
              <span className="pm-acct-sig-k">hmac_sha256(body, secret)</span>
            </p>
            <p className="pm-t-mono pm-acct-sig-v">sha256=4be1…9c0d</p>
            <p className="pm-acct-sig-eq">
              <span className="pm-acct-sig-mark" aria-hidden="true" />
              equals <code className="pm-t-mono">x-proofmart-signature</code>, so it came from ProofMart
            </p>
          </div>
        }
      >
        <div className="pm-acct-http" aria-label="An example delivery">
          <p className="pm-t-mono pm-acct-http-line">
            <span data-tone="dim">POST</span> /hooks <span data-tone="dim">HTTP/1.1</span>
          </p>
          <p className="pm-t-mono pm-acct-http-line">
            <span data-tone="dim">x-proofmart-event:</span> verification.completed
          </p>
          <p className="pm-t-mono pm-acct-http-line">
            <span data-tone="dim">x-proofmart-delivery:</span> dlv_8f3a21c7
          </p>
          <p className="pm-t-mono pm-acct-http-line">
            <span data-tone="dim">x-proofmart-signature:</span> <span data-tone="accent">sha256=4be1…9c0d</span>
          </p>
          <p className="pm-t-mono pm-acct-http-line pm-acct-http-gap">
            <span data-tone="dim">{"{"}</span> &quot;verdict&quot;: &quot;FAIL&quot;, &quot;findings&quot;: 3, <span data-tone="dim">…</span> <span data-tone="dim">{"}"}</span>
          </p>
        </div>
      </DepthStage>

      <CodeCard
        label="verify-webhook.js"
        note="Node"
        className="pm-acct-code-solo"
        lines={[
          { parts: [{ text: "import ", tone: "dim" }, { text: "{ createHmac, timingSafeEqual }" }] },
          { indent: 2, parts: [{ text: "from ", tone: "dim" }, { text: '"node:crypto"', tone: "str" }, { text: ";", tone: "dim" }] },
          { text: "" },
          { parts: [{ text: "function ", tone: "dim" }, { text: "isFromProofMart(rawBody, signature) {" }] },
          { indent: 2, parts: [{ text: "const ", tone: "dim" }, { text: "expected = " }, { text: '"sha256="', tone: "str" }, { text: " + createHmac(" }, { text: '"sha256"', tone: "str" }, { text: "," }] },
          { indent: 4, parts: [{ text: "process.env." }, { text: "PROOFMART_WEBHOOK_SECRET", tone: "accent" }, { text: ")" }] },
          { indent: 4, parts: [{ text: ".update(rawBody).digest(" }, { text: '"hex"', tone: "str" }, { text: ");" }] },
          { indent: 2, parts: [{ text: "const ", tone: "dim" }, { text: "a = Buffer.from(expected);" }] },
          { indent: 2, parts: [{ text: "const ", tone: "dim" }, { text: "b = Buffer.from(signature ?? " }, { text: '""', tone: "str" }, { text: ");" }] },
          { indent: 2, parts: [{ text: "return ", tone: "dim" }, { text: "a.length === b.length &&" }] },
          { indent: 4, text: "timingSafeEqual(a, b);" },
          { text: "}" },
        ]}
      />

      <ul className="pm-acct-defs" aria-label="Headers on every delivery">
        <li>
          <code className="pm-acct-code-inline">x-proofmart-signature</code>
          <span>
            <code className="pm-acct-code-inline">sha256=</code> followed by the hex HMAC of the body.
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
          <dt className="pm-t-label">Where&apos;s the secret?</dt>
          <dd>Shown once, when you add the endpoint. ProofMart can&apos;t display it again; if it&apos;s lost, delete the endpoint and add it back.</dd>
        </div>
        <div>
          <dt className="pm-t-label">Retries</dt>
          <dd>
            Anything but a 2xx within 10 seconds is retried 5 times over about 13 hours, then marked as given up. A paused endpoint receives nothing, and events
            aren&apos;t saved up for it.
          </dd>
        </div>
      </dl>
    </aside>
  );
}
