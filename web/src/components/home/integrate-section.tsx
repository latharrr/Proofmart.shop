import Link from "next/link";
import type { ReactNode } from "react";
import Reveal from "@/components/home/reveal";
import { INTEGRATIONS } from "@/lib/home-data";

// The terminal is a content card, so it carries no shadow and no syntax
// rainbow: the only saturated colour in it is the verdict, which is the one
// thing in the transcript that actually means something.
const DIM = { color: "var(--pm-smoke)" };
const FAIL = { color: "var(--pm-fail)" };
const REVIEW = { color: "var(--pm-review)" };

// One entry per line, rendered as blocks so a line that has to wrap on a
// phone hangs under its own indent instead of falling back to the margin.
const TERMINAL: { indent?: number; parts: ReactNode[] }[] = [
  { parts: [<span key="p" style={DIM}>$</span>, " curl https://proofmart.shop/v1/verify \\"] },
  { indent: 4, parts: ["-H ", <span key="h" style={DIM}>&quot;Authorization: Bearer $PROOFMART_API_KEY&quot;</span>, " \\"] },
  { indent: 4, parts: ["-F ", <span key="f" style={DIM}>&quot;file=@hdfc_apr25.pdf&quot;</span>] },
  { parts: [] },
  { parts: [<span key="c" style={DIM}># 200 OK in 4.8 s — summarised</span>] },
  { parts: [<span key="v" style={FAIL}>× FAIL</span>, "  4 findings"] },
  { indent: 2, parts: [<span key="g" style={FAIL}>×</span>, " BALANCE_BREAK              p4 · r17"] },
  { indent: 2, parts: [<span key="g" style={FAIL}>×</span>, " CROSS_PAGE_TOTAL_MISMATCH  p3 → p4"] },
  { indent: 2, parts: [<span key="g" style={REVIEW}>~</span>, " DUPLICATE_TRANSACTION      p2 · r04"] },
  { indent: 2, parts: [<span key="g" style={REVIEW}>~</span>, " OCR_LOW_CONFIDENCE         p4 · r14"] },
];

export default function IntegrateSection() {
  return (
    <section id="integrate" className="pm-band-fog">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
              <p className="pm-eyebrow">04 · Integrate</p>
              <h2 className="pm-h2">One POST. Same engine everywhere.</h2>
          </div>
          <p className="pm-lead">
            Send a PDF as multipart form data with your API key; the response arrives inline. The upload on this page, the API, webhooks and the CLI
            all run the same pipeline.
          </p>
        </Reveal>

        <div className="pm-integrate-grid">
          <div>
            <Reveal className="pm-terminal">
              <div className="pm-ink-card-head">
                <span className="pm-mono" style={{ color: "var(--pm-paper)" }}>
                  terminal
                </span>
                <span className="pm-mono" style={{ color: "var(--pm-smoke)" }}>
                  PDF up to 20 MB
                </span>
              </div>
              <div className="pm-mono pm-terminal-body" role="figure" aria-label="Sample curl request and summarised response">
                {TERMINAL.map((line, i) => (
                  <div key={i} className="pm-json-line" style={{ ["--pm-indent" as string]: line.indent ?? 0 }}>
                    {line.parts.length === 0 ? "\u00a0" : line.parts}
                  </div>
                ))}
              </div>
            </Reveal>
            <div className="pm-integrate-links">
              <Link href="/account/api-keys" className="pm-btn pm-btn-filled">
                Create an API key
              </Link>
              <Link href="/account/webhooks" className="pm-link">
                Register a webhook
                <span className="pm-arrow" aria-hidden="true">
                  <span>→</span>
                </span>
              </Link>
              <a href="#outputs" className="pm-link">
                See the full response
                <span className="pm-arrow" aria-hidden="true">
                  <span>→</span>
                </span>
              </a>
            </div>
          </div>

          <ul className="pm-ways">
            {INTEGRATIONS.map((it, i) => (
              <Reveal key={it.name} as="li" delay={(i + 1) * 300} className="pm-way">
                <div className="pm-way-top">
                  <h3 className="pm-body" style={{ fontWeight: 450, margin: 0 }}>
                    {it.name}
                  </h3>
                  <span className="pm-caption" style={{ color: "var(--pm-ash)", whiteSpace: "nowrap" }}>
                    {it.kind}
                  </span>
                </div>
                <p className="pm-caption" style={{ color: "var(--pm-slate)" }}>
                  {it.body}
                </p>
                <p className="pm-mono" style={{ color: "var(--pm-ink)", marginTop: 8 }}>
                  {it.code}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
