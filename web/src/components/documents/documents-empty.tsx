import { FINDINGS } from "@/lib/evidence-data";
import { VERIFY_HREF } from "@/components/app/app-shell";
import Frame from "@/components/motion/frame";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import Tilt from "@/components/motion/tilt";
import DocumentStage from "@/components/three/document-stage";
import { VerdictBadge } from "./verdict";

const STEPS = [
  { title: "Upload a PDF", body: "Bank statement, invoice, salary slip or payment proof." },
  { title: "Every marker re-checks the numbers", body: "Running balances, page carry-overs, duplicate rows." },
  { title: "The report lands on this page", body: "One verdict, each finding pinned to its box." },
] as const;

/**
 * First-run state for My documents: what to do (three ruled steps, one
 * primary pill) beside what you get back — the live 3D statement on a framed
 * graphite stage, with the finding it would raise floating over it as a
 * paper card that tilts toward the pointer. The card is the same bundled
 * BALANCE_BREAK finding the home page opens with (the scene's boxed row is
 * that row), so the example and the product never disagree.
 */
export default function DocumentsEmpty() {
  const fail = FINDINGS.find((f) => f.marker === "BALANCE_BREAK") ?? FINDINGS[0];
  const failCount = FINDINGS.filter((f) => f.verdict === "FAIL").length;
  const reviewCount = FINDINGS.filter((f) => f.verdict === "REVIEW").length;

  return (
    <section className="pm-docs-empty" aria-labelledby="pm-docs-empty-title" data-testid="documents-empty">
      <div className="pm-docs-empty-text">
        <p className="pm-app-eyebrow">
          <span className="pm-app-eyebrow-dot" aria-hidden="true" />
          No documents yet
        </p>
        <LineReveal as="h2" id="pm-docs-empty-title" className="pm-docs-empty-lead" delay={160}>
          Verify your first PDF. Its report is saved here, private to you.
        </LineReveal>

        <Reveal as="ol" className="pm-docs-steps" delay={240}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="pm-docs-step-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="pm-docs-step-text">
                <span className="pm-docs-step-title">{s.title}</span>
                <span className="pm-docs-step-body">{s.body}</span>
              </span>
            </li>
          ))}
        </Reveal>

        <Reveal className="pm-docs-empty-cta" delay={320}>
          <RollPill href={VERIFY_HREF} dot>
            Verify a document
          </RollPill>
          <a href="/#markers" className="pm-inline-link">
            See what gets checked
          </a>
        </Reveal>
      </div>

      <Reveal as="figure" className="pm-docs-empty-figure" delay={120} aria-label="Example of a saved report">
        <Frame columns={2} tone="graphite" label="Example report" className="pm-docs-empty-frame" stageClassName="pm-docs-empty-stage">
          <DocumentStage
            variant="single"
            tone="graphite"
            verdict="FAIL"
            preload
            label="Example: a bank statement under examination, one row boxed in red and marked FAIL."
          />
          <div className="pm-docs-empty-meta" aria-hidden="true">
            <span>hdfc_apr25_statement.pdf</span>
            <span>
              {failCount} fail · {reviewCount} review · 6 pages
            </span>
          </div>
        </Frame>

        <Tilt max={6} className="pm-docs-empty-card-wrap" innerClassName="pm-docs-empty-card">
          <div className="pm-docs-card-top">
            <span className="pm-docs-card-marker">{fail.marker}</span>
            <VerdictBadge verdict="FAIL" />
          </div>
          <p className="pm-docs-card-summary">{fail.explanation}</p>
          <pre className="pm-docs-card-math">{fail.arithmetic}</pre>
          <p className="pm-docs-card-foot">
            <span>{fail.addr1}</span>
            <span>rect {fail.rect ? `${fail.rect.x},${fail.rect.y},${fail.rect.w},${fail.rect.h}` : "doc"}</span>
          </p>
        </Tilt>
      </Reveal>
    </section>
  );
}
