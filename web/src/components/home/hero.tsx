import CopyButton from "@/components/account/copy-button";
import RollPill from "@/components/motion/roll-pill";
import HeroPeek from "@/components/home/hero-peek";
import RunSampleButton from "@/components/home/run-sample-button";
import { Serif } from "@/components/home/section-head";
import { MARKER_REGISTRY } from "@/lib/verification/registry";

const CURL = `curl https://proofmart.shop/v1/verify -H "Authorization: Bearer $PROOFMART_API_KEY" -F file=@statement.pdf`;

/**
 * Left eight columns: the claim at display size and the two ways in. Right
 * four: the system panel, every row a fact the code states (the marker
 * count is the registry's own length), typed in once on load, then the
 * one call that runs it all, ready to copy.
 */
// Typing schedule for the system panel (CSS, before any script loads):
// 18ms a character, each row starting when the one above it ends.
const CHAR_MS = 18;
const START_MS = 420;

export default function Hero() {
  const SYSTEM: [string, string][] = [
    ["engine", "deterministic rules"],
    ["markers", String(MARKER_REGISTRY.length)],
    ["verdicts", "FAIL > REVIEW > CLEAR"],
    ["signing", "Ed25519"],
    ["delivery", "web · api · webhooks · cli"],
    ["billing", "INR · Razorpay"],
  ];
  const lens = SYSTEM.map(([k, v]) => k.length + 1 + v.length + 2);
  const starts = lens.map((_, i) => START_MS + lens.slice(0, i).reduce((a, b) => a + b, 0) * CHAR_MS);
  const typing = (i: number) => ({ ["--d" as string]: `${starts[i]}ms`, ["--n" as string]: lens[i], ["--t" as string]: `${lens[i] * CHAR_MS}ms` });
  const curlStart = starts[starts.length - 1] + lens[lens.length - 1] * CHAR_MS;

  return (
    // `id="run"`: older in-app links send people to /#run to verify a document.
    <section id="run" className="pm-hero" aria-labelledby="hero-title">
      <div className="pm-wrap">
        <p className="pm-index" data-leader="">
          <span className="pm-index-n">[01]</span>
          <span className="pm-index-dash" aria-hidden="true">
            —
          </span>
          <span className="pm-index-label">ProofMart</span>
          <span className="pm-index-leader" aria-hidden="true" />
          <span className="pm-index-meta">Document forensics API · India</span>
        </p>

        <div className="pm-hero-grid">
          <div className="pm-hero-copy">
            <h1 id="hero-title" className="pm-hero-title">
              <span className="pm-mask">
                <span>Point at</span>
              </span>{" "}
              <span className="pm-mask">
                <span>
                  <Serif>the row.</Serif>
                </span>
              </span>
            </h1>
            <p className="pm-hero-lead">
              ProofMart re-adds every row of a PDF bank statement with fixed rules, with no model in the path, and pins each finding to its page, row
              and box. Then one verdict: <span className="pm-v" data-tone="FAIL">FAIL</span>, <span className="pm-v" data-tone="REVIEW">REVIEW</span> or{" "}
              <span className="pm-v" data-tone="CLEAR">CLEAR</span>.
            </p>
            <div className="pm-actions">
              <RunSampleButton>Run the sample</RunSampleButton>
              <RollPill href="#outputs" native variant="secondary">
                Read <span className="pm-mono">/v1/verify</span>
              </RollPill>
            </div>
          </div>

          <aside className="pm-sys" aria-label="System">
            <div className="pm-sys-head">
              <span>system</span>
              <span className="pm-sys-live">
                <span aria-hidden="true" className="pm-mk-api-dot" />
                /v1
              </span>
            </div>
            <dl className="pm-sys-rows">
              {SYSTEM.map(([k, v], i) => (
                <div key={k} className="pm-sys-row" style={typing(i)}>
                  <dt>{k}:</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="pm-sys-curl" data-cursor="copy" style={{ ["--d" as string]: `${curlStart}ms`, ["--t" as string]: `${Math.min(900, CURL.length * 6)}ms` }}>
              <code>
                <span className="pm-sys-prompt" aria-hidden="true">
                  ${" "}
                </span>
                {CURL}
              </code>
              <CopyButton value={CURL} copiedLabel="Copied" variant="paper" size="sm" ariaLabel="Copy the curl command">
                Copy
              </CopyButton>
            </div>
          </aside>
        </div>
        <HeroPeek />
      </div>
      {/* Where the travelling document settles while the hero is pinned. */}
      <div className="pm-fly-slot" aria-hidden="true" />
    </section>
  );
}
