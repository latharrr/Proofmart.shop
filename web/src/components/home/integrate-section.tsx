import type { ReactNode } from "react";
import RollPill from "@/components/motion/roll-pill";
import SheetHead from "@/components/home/sheet-head";
import Tickmark from "@/components/paper/tickmark";
import { INTEGRATIONS } from "@/lib/home-data";

// A printout of the call and its summarised answer. The only colour in it is
// the verdict, which is the one thing in it that actually means something.
const TERMINAL: { indent?: number; parts: ReactNode[] }[] = [
  { parts: [<span key="p" className="pm-j-punct">$</span>, " curl https://proofmart.shop/v1/verify \\"] },
  { indent: 4, parts: ["-H ", <span key="h" className="pm-j-key">&quot;Authorization: Bearer $PROOFMART_API_KEY&quot;</span>, " \\"] },
  { indent: 4, parts: ["-F ", <span key="f" className="pm-j-key">&quot;file=@hdfc_apr25.pdf&quot;</span>] },
  { parts: [] },
  { parts: [<span key="c" className="pm-j-punct"># 200 OK, summarised</span>] },
  { parts: [<span key="v" className="pm-j-fail">FAIL</span>, "  4 findings"] },
  { indent: 2, parts: [<span key="g" className="pm-j-fail">break</span>, "  BALANCE_BREAK              p4 · r17"] },
  { indent: 2, parts: [<span key="g" className="pm-j-fail">break</span>, "  CROSS_PAGE_TOTAL_MISMATCH  p3 → p4"] },
  { indent: 2, parts: [<span key="g" className="pm-j-review">query</span>, "  DUPLICATE_TRANSACTION      p2 · r04,r07"] },
  { indent: 2, parts: [<span key="g" className="pm-j-review">query</span>, "  OCR_LOW_CONFIDENCE         p4 · r14"] },
];

/**
 * Wiring it in: the call as a printout, and the four ways the same engine is
 * delivered as a ledger, each with what it needs and the string you'd type.
 */
export default function IntegrateSection() {
  return (
    <section id="integrate" className="pm-h-section" aria-labelledby="integrate-title">
      <div className="pm-wrap">
        <SheetHead
          id="integrate-title"
          wp="E"
          title="One POST. Same engine everywhere."
          aside={
            <p>
              Send a PDF as multipart form data with your API key; the response arrives inline. The upload on this page, the API, webhooks and the CLI
              all run the same pipeline.
            </p>
          }
        />

        <div className="pm-h-integrate">
          <div className="pm-h-integrate-call">
            <figure className="pm-print" aria-label="Sample curl request and summarised response">
              <div className="pm-print-head">
                <span className="pm-mono">terminal</span>
                <span className="pm-mono">PDF up to 20 MB</span>
                <span className="pm-sample">Sample</span>
              </div>
              <div className="pm-json">
                {TERMINAL.map((line, i) => (
                  <div key={i} className="pm-json-line" style={{ ["--indent" as string]: line.indent ?? 0 }}>
                    <span className="pm-json-n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{line.parts.length === 0 ? " " : line.parts}</span>
                  </div>
                ))}
              </div>
            </figure>
            <div className="pm-h-actions">
              <RollPill href="/account/api-keys" dot>
                Create an API key
              </RollPill>
              <RollPill href="/account/webhooks" variant="secondary">
                Register a webhook
              </RollPill>
            </div>
          </div>

          <ol className="pm-h-ways">
            {INTEGRATIONS.map((it) => (
              <li key={it.name}>
                <div className="pm-h-way-top">
                  <h3>{it.name}</h3>
                  <span className="pm-label">{it.kind}</span>
                </div>
                <p>{it.body}</p>
                <span className="pm-mono pm-h-way-code">
                  <Tickmark kind="agreed" size={14} />
                  {it.code}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
