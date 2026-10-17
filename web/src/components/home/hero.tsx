import OpenScanButton from "@/components/home/open-scan-button";
import RollPill from "@/components/motion/roll-pill";
import StatementSheet from "@/components/paper/statement-sheet";
import Tickmark from "@/components/paper/tickmark";

const ASSURANCES = [
  { k: "No model in the path", v: "Deterministic rules over the page's own arithmetic. No LLM, no score." },
  { k: "Same bytes, same verdict", v: "Every result records the engine version that produced it." },
  { k: "Nothing kept signed out", v: "A signed-out upload is deleted as soon as its scan finishes." },
];

const LEGEND = [
  { kind: "agreed" as const, tone: "ink", label: "Agrees with prior balance ± the row" },
  { kind: "break" as const, tone: "fail", label: "Break: verdict FAIL" },
  { kind: "query" as const, tone: "review", label: "Query: verdict REVIEW" },
  { kind: "footed" as const, tone: "ink", label: "Footed: the column re-added" },
];

/**
 * The first sheet on the pad. Left: what ProofMart is, in one sentence, and
 * the two ways in. Right: page 4 of the sample statement, re-footed, with
 * its breaks ringed. Along the foot, the tickmark legend that every other
 * sheet on the site is written in.
 */
export default function Hero() {
  return (
    // `id="run"`: older in-app links send people to /#run to verify a document.
    <section id="run" className="pm-h-hero" aria-labelledby="hero-title">
      <div className="pm-wrap pm-h-hero-grid">
        <div className="pm-h-hero-copy">
          <h1 id="hero-title" className="pm-h-title">
            Footed, cross&#8209;footed, <span className="pm-red">ticked.</span>
          </h1>
          <p className="pm-h-lead">
            ProofMart re-adds every row of a PDF bank statement, ticks each balance that agrees and rings each one that doesn&rsquo;t, with the sum that
            proves it. Then one verdict: FAIL, REVIEW or CLEAR.
          </p>
          <div className="pm-h-actions">
            <OpenScanButton>Start a scan</OpenScanButton>
            <RollPill href="#outputs" native variant="secondary">
              Read the API response
            </RollPill>
          </div>
          <dl className="pm-h-assure">
            {ASSURANCES.map((a) => (
              <div key={a.k}>
                <dt>
                  <Tickmark kind="agreed" size={15} />
                  {a.k}
                </dt>
                <dd>{a.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <StatementSheet animate className="pm-h-sheet" />
      </div>

      <div className="pm-wrap">
        <div className="pm-h-legend">
          <p className="pm-h-legend-title">Tickmarks used on this site</p>
          <ul>
            {LEGEND.map((l) => (
              <li key={l.kind} data-tone={l.tone}>
                <Tickmark kind={l.kind} />
                {l.label}
              </li>
            ))}
          </ul>
          <a href="#access" className="pm-xref">
            Whole statement, live: W/P A
          </a>
        </div>
      </div>
    </section>
  );
}
