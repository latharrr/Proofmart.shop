"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import SectionHead, { Serif } from "@/components/home/section-head";
import Tabs from "@/components/home/tabs";
import SampleDocument from "@/components/evidence-rail/sample-document";
import { SAMPLE_FINDINGS, SAMPLE_VIEWBOX } from "@/components/evidence-rail/sample-statement";

/*
 * The sample response, in the envelope lib/api/envelope.ts's verifyEnvelope()
 * returns: { document, classification, verdict, findings, facts, processing }
 * plus requestId. Trimmed (one finding shown, arrays elided) but never
 * reshaped.
 */
const FIRST = SAMPLE_FINDINGS[0];
const BOX = FIRST.rect!;
const RESPONSE = `{
  "requestId": "req_8fk2",
  "verdict": "FAIL",
  "classification": {
    "pdfType": "TextBased",
    "documentKind": "bank_statement"
  },
  "findings": [
    {
      "markerId": "BALANCE_BREAK",
      "verdict": "FAIL",
      "severity": "critical",
      "evidence": {
        "summary": "Running balance differs by ₹5,000.00",
        "detail": "84,210.00 + 12,500.00 = 96,710.00 · shows 91,710.00",
        "coordinates": [
          { "page": ${FIRST.page}, "rect": { "x": ${BOX.x}, "y": ${BOX.y}, "w": ${BOX.w}, "h": ${BOX.h} } }
        ]
      }
    },
    …3 more
  ],
  "processing": { "markersRun": […6] }
}`;

// lib/webhooks/dispatch.ts: the body POSTed to your URL, and the headers
// lib/webhooks/deliver.ts sends with it.
const WEBHOOK = `{
  "id": "evt_…",
  "type": "verification.completed",
  "createdAt": "2026-04-30T10:12:04.000Z",
  "verificationId": "req_8fk2",
  "result": { "verdict": "FAIL", "findings": […4], … }
}`;

// lib/signing/sign.ts: SignatureEnvelope { payload, signature, algorithm, keyId }.
const DOSSIER = `{
  "algorithm": "ed25519",
  "keyId": "…",
  "payload": {
    "verificationId": "req_8fk2",
    "documentHash": "sha256 of the exact bytes verified",
    "engineVersion": "…",
    "timestamp": "…",
    "verdict": "FAIL",
    "findings": […4]
  },
  "signature": "base64, 64 bytes"
}`;

// The CLI's real summary format (cli/bin/proofmart.mjs, summarize()).
const RUN = [
  { k: "cmd", t: "$ proofmart verify meridian_apr25_statement.pdf" },
  { k: "out", t: "verdict:  FAIL" },
  { k: "out", t: `findings: ${SAMPLE_FINDINGS.length}` },
  ...SAMPLE_FINDINGS.map((f) => ({ k: f.verdict, t: `  ${f.verdict.padEnd(6)} ${f.marker} — ${f.addr1}` })),
];

const GEO_KEYS = new Set(['"page"', '"rect"', '"x"', '"y"', '"w"', '"h"', '"coordinates"']);
const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d[\d.]*)|([{}[\],:])/g;

/** Token-coloured JSON; keys that address the page carry `data-geo` so hovering them lights the box on the thumbnail. */
function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of src.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(src.slice(last, idx));
    if (m[1] && m[2]) {
      out.push(
        <span key={k++} className="pm-j-key" data-geo={GEO_KEYS.has(m[1]) ? "" : undefined}>
          {m[1]}
        </span>,
        <span key={k++} className="pm-j-punct">
          {m[2]}
        </span>,
      );
    } else if (m[1]) {
      const cls = m[1] === '"FAIL"' ? "pm-j-fail" : m[1] === '"REVIEW"' ? "pm-j-review" : m[1] === '"CLEAR"' ? "pm-j-clear" : "pm-j-str";
      out.push(
        <span key={k++} className={cls}>
          {m[1]}
        </span>,
      );
    } else if (m[3]) {
      out.push(
        <span key={k++} className="pm-j-num">
          {m[3]}
        </span>,
      );
    } else {
      out.push(
        <span key={k++} className="pm-j-punct">
          {m[4]}
        </span>,
      );
    }
    last = idx + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

function Json({ src }: { src: string }) {
  return (
    <div className="pm-json">
      {src.split("\n").map((line, i) => {
        const indent = line.length - line.trimStart().length;
        return (
          <div key={i} className="pm-json-line" style={{ ["--indent" as string]: indent }}>
            <span className="pm-json-n" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{highlight(line.trimStart())}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * What comes back, in the inverted terminal: the CLI run types in line by
 * line once the window scrolls into view, then the JSON it summarises.
 * Hovering a key that addresses the page (page, rect, x…) lights the box on
 * the thumbnail beside it. The dossier tab shows the signature envelope.
 */
export default function OutputsSection() {
  const [geo, setGeo] = useState(false);
  const [run, setRun] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = termRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        // With the scroll layer running, it opens the window first and starts the run itself.
        if ("gsap" in document.documentElement.dataset) return;
        if (e.isIntersecting) {
          el.dataset.run = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onOver = (e: MouseEvent<HTMLDivElement>) => setGeo(Boolean((e.target as HTMLElement).closest("[data-geo]")));

  return (
    <section id="outputs" className="pm-section pm-invert" aria-labelledby="outputs-title">
      <div className="pm-wrap">
        <SectionHead
          n="05"
          label="Outputs"
          meta="JSON · webhook · dossier"
          id="outputs-title"
          title={
            <>
              One verdict, <Serif>and the evidence.</Serif>
            </>
          }
          aside={
            <>
              <p>
                The API returns JSON you can route on. Every finding carries its page and box in PDF points, so you can draw it over the page. A saved scan
                also exports as an Ed25519-signed dossier that anyone can check, no account needed.
              </p>
              <dl className="pm-fields">
                <div>
                  <dt className="pm-mono">verdict</dt>
                  <dd>FAIL, REVIEW or CLEAR, or INCONCLUSIVE when no check had data to run. One field to route on.</dd>
                </div>
                <div>
                  <dt className="pm-mono">evidence.detail</dt>
                  <dd>The comparison the marker made, so a reviewer can redo it by hand.</dd>
                </div>
                <div>
                  <dt className="pm-mono">coordinates[].rect</dt>
                  <dd>Where, on which page. Hover it in the response to see the box.</dd>
                </div>
              </dl>
            </>
          }
        />

        <div className="pm-out" data-reveal="">
          <div className="pm-term" ref={termRef} onMouseOver={onOver} onMouseLeave={() => setGeo(false)}>
            <div className="pm-term-bar">
              <span className="pm-term-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="pm-mono">proofmart · POST /v1/verify</span>
              <span className="pm-sample">Sample</span>
            </div>
            <Tabs
              label="Output format"
              className="pm-tabs pm-term-tabs"
              onChange={() => setRun((r) => r + 1)}
              tabs={[
                {
                  id: "json",
                  label: "JSON report",
                  content: (
                    <div key={run} className="pm-term-body">
                      <ol className="pm-run" aria-label="Sample CLI run">
                        {RUN.map((l, i) => (
                          <li key={i} data-k={l.k} style={{ ["--i" as string]: i }}>
                            {l.t}
                          </li>
                        ))}
                      </ol>
                      <span className="pm-run-caret" aria-hidden="true" />
                      <div className="pm-run-after" style={{ ["--i" as string]: RUN.length }}>
                        <Json src={RESPONSE} />
                      </div>
                    </div>
                  ),
                },
                {
                  id: "webhook",
                  label: "Webhook payload",
                  content: (
                    <div className="pm-term-body">
                      <ol className="pm-run" data-static="" aria-label="Webhook request headers">
                        <li data-k="cmd">POST https://your-app.example/hooks/proofmart</li>
                        <li data-k="out">x-proofmart-event: verification.completed</li>
                        <li data-k="out">x-proofmart-delivery: …</li>
                        <li data-k="out">x-proofmart-signature: HMAC-SHA256 of the raw body</li>
                      </ol>
                      <Json src={WEBHOOK} />
                    </div>
                  ),
                },
                {
                  id: "dossier",
                  label: "Signed dossier",
                  content: (
                    <div className="pm-term-body">
                      <ol className="pm-run" data-static="" aria-label="Dossier">
                        <li data-k="cmd">GET /api/documents/[id]/dossier → req_8fk2.dossier.pdf</li>
                        <li data-k="out">signed: Ed25519 over the canonical payload, incl. the sha256 of the verified bytes</li>
                      </ol>
                      <Json src={DOSSIER} />
                      <p className="pm-term-note">
                        Anyone can POST a dossier’s signature envelope to <span className="pm-mono">/v1/verify-signature</span>, no account and no key.{" "}
                        <a href="/security#signing" className="pm-link">
                          Verify without an account
                        </a>
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <figure className="pm-out-thumb" data-geo-on={geo ? "" : undefined}>
            <div className="pm-out-page">
              <SampleDocument page={FIRST.page} />
              <svg viewBox={`0 0 ${SAMPLE_VIEWBOX.w} ${SAMPLE_VIEWBOX.h}`} className="pm-out-box" aria-hidden="true">
                <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={2} />
              </svg>
            </div>
            <figcaption>
              <span className="pm-mono">
                page {FIRST.page} · rect {BOX.x},{BOX.y} {BOX.w}×{BOX.h}
              </span>
              <span>Sample page, the box the response cites.</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
