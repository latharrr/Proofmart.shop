import Link from "next/link";
import CodeCard from "./code-card";
import DepthStage from "./depth-stage";

/**
 * "Make your first call": the request as a printout, and the response it
 * produces clipped beneath it.
 */
export default function FirstCall() {
  return (
    <aside className="pm-acct-aside" aria-labelledby="pm-acct-quick-title">
      <div className="pm-acct-aside-head">
        <h2 id="pm-acct-quick-title" className="pm-t-heading-sm">
          Make your first call
        </h2>
        <p className="pm-acct-hint">Put the key in an environment variable, then POST a PDF as multipart form data. The verdict comes back in the response.</p>
      </div>

      <DepthStage
        label="POST /v1/verify"
        floatLabel="200 OK · application/json"
        float={
          <div className="pm-acct-resp" aria-label="An example response">
            <div className="pm-acct-resp-head">
              <span className="pm-t-mono pm-acct-resp-file">statement.pdf</span>
              <span className="pm-acct-verdict" data-verdict="FAIL">
                FAIL
              </span>
            </div>
            <p className="pm-t-mono pm-acct-resp-marker">BALANCE_BREAK</p>
            <p className="pm-acct-resp-text">Running balance differs from prior + credit − debit by ₹5,000.00.</p>
            <p className="pm-t-mono pm-acct-resp-coord">p4 · r17 · box 548,528</p>
          </div>
        }
      >
        <CodeCard
          label="terminal"
          note="PDF ≤ 20 MB"
          className="pm-acct-code-flush"
          lines={[
            { parts: [{ text: "curl " }, { text: "https://proofmart.shop/v1/verify", tone: "str" }, { text: " \\", tone: "dim" }] },
            {
              indent: 2,
              parts: [{ text: "-H ", tone: "dim" }, { text: '"Authorization: Bearer ' }, { text: "$PROOFMART_API_KEY", tone: "accent" }, { text: '"' }, { text: " \\", tone: "dim" }],
            },
            { indent: 2, parts: [{ text: "-F ", tone: "dim" }, { text: '"file=@statement.pdf"' }] },
          ]}
        />
      </DepthStage>

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
        <Link href="/account/billing" className="pm-inline-link">
          Calls count toward your monthly quota
        </Link>
        <Link href="/account/webhooks" className="pm-inline-link">
          Get verdicts pushed to your server
        </Link>
      </div>
    </aside>
  );
}
