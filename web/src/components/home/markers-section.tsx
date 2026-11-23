import SectionHead, { Serif } from "@/components/home/section-head";
import MarkerVisual from "@/components/home/marker-visual";
import Tickmark, { Ident, VERDICT_TICK } from "@/components/paper/tickmark";
import { MARKER_REGISTRY } from "@/lib/verification/registry";
import type { MarkerCategory } from "@/lib/verification/types";

// The verdict each family's markers raise, as the marker files emit it
// (arithmetic breaks FAIL; everything else asks for REVIEW). The markers
// themselves come from the live registry, so the grid can never show one
// the engine doesn't run.
const FAMILY: { cat: MarkerCategory; verdict: "FAIL" | "REVIEW" }[] = [
  { cat: "Arithmetic", verdict: "FAIL" },
  { cat: "Semantic", verdict: "REVIEW" },
  { cat: "Extraction", verdict: "REVIEW" },
];

/** The marker catalogue: a bordered grid, one column per family, straight from MARKER_REGISTRY. */
export default function MarkersSection() {
  return (
    <section id="markers" className="pm-section" aria-labelledby="markers-title">
      <div className="pm-wrap">
        <SectionHead
          n="04"
          label="Markers"
          meta={`${MARKER_REGISTRY.length} rules · registry`}
          id="markers-title"
          title={
            <>
              {MARKER_REGISTRY.length} checks. Each one <Serif>shows its work.</Serif>
            </>
          }
          aside={
            <p>
              Every marker is a narrow rule with a fixed verdict. When one fires, the finding carries the page, the box and the comparison it made, so a
              reviewer can redo it by eye.
            </p>
          }
        />

        <div className="pm-mk-grid">
          {FAMILY.map((fam) => {
            const markers = MARKER_REGISTRY.filter((m) => m.category === fam.cat);
            if (markers.length === 0) return null;
            return (
              <div key={fam.cat} className="pm-mk-family" role="group" aria-label={`${fam.cat} markers`}>
                <p className="pm-mk-family-h">
                  <span>{fam.cat}</span>
                  <span>{markers.length}</span>
                </p>
                {markers.map((m) => (
                  <article key={m.id} className="pm-mk-cell" data-tone={fam.verdict}>
                    <div className="pm-mk-cell-top">
                      <h3 className="pm-mk-code">
                        <Ident>{m.id}</Ident>
                      </h3>
                      <span className="pm-mk-verdict" data-size="sm" data-tone={fam.verdict}>
                        <Tickmark kind={VERDICT_TICK[fam.verdict]} size={12} />
                        {fam.verdict}
                      </span>
                    </div>
                    <MarkerVisual id={m.id} />
                    <p className="pm-mk-rule">{m.description}</p>
                  </article>
                ))}
              </div>
            );
          })}
        </div>

        <p className="pm-note">
          <strong>Not checked yet:</strong> producer and template mismatches, and font-metric edits. We don&rsquo;t have the evidence to run them honestly,
          so we don&rsquo;t. A CLEAR verdict means these {MARKER_REGISTRY.length} checks found nothing, not that the document is authentic.
        </p>
      </div>
    </section>
  );
}
