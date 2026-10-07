import type { ReactNode } from "react";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import { ScrollVar } from "@/components/motion/scroll-progress";
import Tilt from "@/components/motion/tilt";
import SectionKicker from "@/components/home/section-kicker";
import { INTEGRATIONS } from "@/lib/home-data";

// The only saturated colour in the transcript is the verdict, which is the
// one thing in it that actually means something.
const TERMINAL: { indent?: number; parts: ReactNode[] }[] = [
  { parts: [<span key="p" className="pm-mk-t-dim">$</span>, " curl https://proofmart.shop/v1/verify \\"] },
  { indent: 4, parts: ["-H ", <span key="h" className="pm-mk-t-dim">&quot;Authorization: Bearer $PROOFMART_API_KEY&quot;</span>, " \\"] },
  { indent: 4, parts: ["-F ", <span key="f" className="pm-mk-t-dim">&quot;file=@hdfc_apr25.pdf&quot;</span>] },
  { parts: [] },
  { parts: [<span key="c" className="pm-mk-t-dim"># 200 OK in 4.8 s, summarised</span>] },
  { parts: [<span key="v" className="pm-mk-t-fail">× FAIL</span>, "  4 findings"] },
  { indent: 2, parts: [<span key="g" className="pm-mk-t-fail">×</span>, " BALANCE_BREAK              p4 · r17"] },
  { indent: 2, parts: [<span key="g" className="pm-mk-t-fail">×</span>, " CROSS_PAGE_TOTAL_MISMATCH  p3 → p4"] },
  { indent: 2, parts: [<span key="g" className="pm-mk-t-review">~</span>, " DUPLICATE_TRANSACTION      p2 · r04,r07"] },
  { indent: 2, parts: [<span key="g" className="pm-mk-t-review">~</span>, " OCR_LOW_CONFIDENCE         p4 · r14"] },
];

export default function IntegrateSection() {
  return (
    <section id="integrate" className="pm-mk-section pm-mk-integrate" aria-labelledby="integrate-title">
      <div className="pm-wrap">
        <div className="pm-mk-head pm-mk-head-split">
          <div>
            <SectionKicker n="05">Integrate</SectionKicker>
            <LineReveal as="h2" id="integrate-title" className="pm-t-heading-lg">
              One POST. <br />
              Same engine everywhere.
            </LineReveal>
          </div>
          <div className="pm-mk-head-aside">
            <Reveal as="p" className="pm-t-body-lg pm-mk-lead">
              Send a PDF as multipart form data with your API key; the response arrives inline. The upload on this page, the API, webhooks and the CLI
              all run the same pipeline.
            </Reveal>
          </div>
        </div>

        <div className="pm-mk-integrate-grid">
          <ScrollVar range="enter" className="pm-scroll-tilt pm-mk-terminal-depth">
            <Tilt max={4} className="pm-mk-terminal-tilt">
              <div className="pm-mk-terminal">
                <div className="pm-mk-terminal-head">
                  <span className="pm-mk-terminal-lights" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="pm-t-mono">terminal</span>
                  <span className="pm-t-mono pm-mk-t-dim">PDF up to 20 MB</span>
                </div>
                <div className="pm-mk-terminal-body" role="figure" aria-label="Sample curl request and summarised response">
                  {TERMINAL.map((line, i) => (
                    <div key={i} className="pm-mk-json-line" style={{ ["--indent" as string]: line.indent ?? 0 }}>
                      {line.parts.length === 0 ? " " : line.parts}
                    </div>
                  ))}
                </div>
              </div>
            </Tilt>
            <div className="pm-mk-integrate-cta">
              <RollPill href="/account/api-keys" dot>
                Create an API key
              </RollPill>
              <a href="/account/webhooks" className="pm-inline-link">
                Register a webhook
              </a>
            </div>
          </ScrollVar>

          <ul className="pm-mk-ways">
            {INTEGRATIONS.map((it, i) => (
              <Reveal key={it.name} as="li" delay={i * 80} className="pm-mk-way">
                <span className="pm-mk-way-n pm-t-label">{String(i + 1).padStart(2, "0")}</span>
                <span className="pm-mk-way-main">
                  <span className="pm-mk-way-top">
                    <h3 className="pm-t-heading-sm">{it.name}</h3>
                    <span className="pm-t-label pm-mk-mute">{it.kind}</span>
                  </span>
                  <span className="pm-t-body pm-mk-mute">{it.body}</span>
                  <span className="pm-t-mono pm-mk-way-code">{it.code}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
