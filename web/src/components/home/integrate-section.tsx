"use client";

import CopyButton from "@/components/account/copy-button";
import RollPill from "@/components/motion/roll-pill";
import SectionHead, { Serif } from "@/components/home/section-head";
import Tabs from "@/components/home/tabs";
import { INTEGRATIONS } from "@/lib/home-data";

// The same multipart POST /v1/verify (field "file", lib/api/route-helpers.ts)
// in three languages. Node needs 20+ for fs.openAsBlob.
const SNIPPETS = [
  {
    id: "curl",
    label: "curl",
    code: `curl https://proofmart.shop/v1/verify \\
  -H "Authorization: Bearer $PROOFMART_API_KEY" \\
  -F file=@statement.pdf`,
  },
  {
    id: "node",
    label: "Node",
    code: `import { openAsBlob } from "node:fs";

const form = new FormData();
form.append("file", await openAsBlob("statement.pdf"), "statement.pdf");

const res = await fetch("https://proofmart.shop/v1/verify", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.PROOFMART_API_KEY}\` },
  body: form,
});
const { verdict, findings } = await res.json();`,
  },
  {
    id: "python",
    label: "Python",
    code: `import os, requests

with open("statement.pdf", "rb") as f:
    res = requests.post(
        "https://proofmart.shop/v1/verify",
        headers={"Authorization": f"Bearer {os.environ['PROOFMART_API_KEY']}"},
        files={"file": ("statement.pdf", f, "application/pdf")},
    )
print(res.json()["verdict"])`,
  },
];

// lib/webhooks/deliver.ts RETRY_DELAYS_MINUTES = [1, 5, 30, 120, 720]:
// one immediate attempt, then five retries, cumulative from the first.
const RETRIES = [
  { at: 0, label: "0" },
  { at: 1, label: "+1m" },
  { at: 6, label: "+5m" },
  { at: 36, label: "+30m" },
  { at: 156, label: "+2h" },
  { at: 876, label: "+12h" },
];

/** Placed on a log scale so the early retries don't all sit on top of each other. */
const pos = (min: number) => (Math.log10(min + 1) / Math.log10(877)) * 100;

// One stroke icon per channel, drawn in on enter (stroke-dashoffset).
const ICONS: Record<string, string> = {
  "Web upload": "M12 16V4M7 9l5-5 5 5M4 15v5h16v-5",
  API: "M8 4c-2 0-3 1-3 3v2c0 1.5-1 3-2.5 3C4 12 5 13.5 5 15v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5 1 3 2.5 3-1.5 0-2.5 1.5-2.5 3v2c0 2-1 3-3 3",
  Webhooks: "M9 8a3 3 0 1 1 5 2.2L10.5 16M6 15a3 3 0 1 0 3 3h6M18 12a3 3 0 1 1-1.5 5.6L13 11",
  CLI: "M4 6l5 5-5 5M11 18h9",
};

/**
 * Wiring it in: the four delivery channels as one ruled row, then the call
 * in curl, Node and Python, each copyable.
 */
export default function IntegrateSection() {
  return (
    <section id="integrate" className="pm-section" aria-labelledby="integrate-title">
      <div className="pm-wrap">
        <SectionHead
          n="06"
          label="Integrate"
          meta="One engine · four ways in"
          id="integrate-title"
          title={
            <>
              One POST. <Serif>Same engine</Serif> everywhere.
            </>
          }
          aside={
            <p>
              Send a PDF as multipart form data with your API key and the report comes back inline. The upload on this page, the API, webhooks and the
              CLI all run the same pipeline.
            </p>
          }
        />

        <ol className="pm-ways">
          {INTEGRATIONS.map((it, i) => (
            <li key={it.name} className="pm-way">
              <span className="pm-way-top">
                <span className="pm-way-n">{String(i + 1).padStart(2, "0")}</span>
                {ICONS[it.name] ? (
                  <svg className="pm-way-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={ICONS[it.name]} pathLength={1} />
                  </svg>
                ) : null}
              </span>
              <h3 className="pm-way-name">{it.name}</h3>
              <span className="pm-way-kind">{it.kind}</span>
              <p className="pm-way-body">{it.body}</p>
              {it.name === "Webhooks" ? (
                <div className="pm-retry" role="img" aria-label="Delivery attempts: immediately, then after 1 minute, 5 minutes, 30 minutes, 2 hours and 12 hours">
                  <span className="pm-retry-line" aria-hidden="true" />
                  {RETRIES.map((r, k) => (
                    <span key={r.label} className="pm-retry-pt" style={{ left: `${pos(r.at)}%`, ["--i" as string]: k }} aria-hidden="true">
                      <span>{r.label}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              <code className="pm-way-code">{it.code}</code>
            </li>
          ))}
        </ol>

        <div className="pm-code" data-reveal="">
          <Tabs
            label="Language"
            className="pm-tabs pm-code-tabs"
            tabs={SNIPPETS.map((s) => ({
              id: s.id,
              label: s.label,
              content: (
                <div className="pm-code-body" data-cursor="copy">
                  <pre>
                    <code>{s.code}</code>
                  </pre>
                  <CopyButton value={s.code} copiedLabel="Copied" variant="paper" size="sm" ariaLabel={`Copy the ${s.label} example`}>
                    Copy
                  </CopyButton>
                </div>
              ),
            }))}
          />
          <div className="pm-actions">
            <RollPill href="/account/api-keys" dot>
              Create an API key
            </RollPill>
            <RollPill href="/account/webhooks" variant="secondary">
              Register a webhook
            </RollPill>
          </div>
        </div>
      </div>
    </section>
  );
}
