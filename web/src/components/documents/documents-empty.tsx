import Link from "next/link";
import { FINDINGS } from "@/lib/evidence-data";
import { VERIFY_HREF } from "@/components/app/app-shell";
import RollPill from "@/components/motion/roll-pill";
import StatementSheet from "@/components/paper/statement-sheet";
import { VerdictBadge } from "./verdict";

const STEPS = [
  { title: "Upload a PDF", body: "Bank statement, invoice, salary slip or payment proof." },
  { title: "Every marker re-checks the numbers", body: "Running balances, page carry-overs, duplicate rows." },
  { title: "The report lands on this page", body: "One verdict, each finding pinned to its box." },
] as const;

/**
 * First-run state for My documents: what to do (three ruled steps, one
 * primary button) beside what you get back: the sample statement re-footed,
 * with the finding it raises written out beneath it. The finding is the same
 * bundled BALANCE_BREAK the home page opens with, so the example and the
 * product never disagree.
 */
export default function DocumentsEmpty() {
  const fail = FINDINGS.find((f) => f.marker === "BALANCE_BREAK") ?? FINDINGS[0];
  const failCount = FINDINGS.filter((f) => f.verdict === "FAIL").length;
  const reviewCount = FINDINGS.filter((f) => f.verdict === "REVIEW").length;

  return (
    <section className="pm-docs-empty" aria-labelledby="pm-docs-empty-title" data-testid="documents-empty">
      <div className="pm-docs-empty-text">
        <h2 id="pm-docs-empty-title" className="pm-docs-empty-lead">
          No documents yet. Verify your first PDF and its report is saved here, private to you.
        </h2>

        <ol className="pm-docs-steps">
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
        </ol>

        <div className="pm-docs-empty-cta">
          <RollPill href={VERIFY_HREF} dot>
            Verify a document
          </RollPill>
          <Link href="/#markers" className="pm-link">
            See what gets checked
          </Link>
        </div>
      </div>

      <figure className="pm-docs-empty-figure" aria-label="Example of a saved report">
        <StatementSheet className="pm-docs-empty-sheet" showNotes={false} caption="Example: page 4 of the sample statement, re-footed" />
        <div className="pm-docs-empty-card">
          <div className="pm-docs-card-top">
            <span className="pm-docs-card-marker">{fail.marker}</span>
            <VerdictBadge verdict="FAIL" />
          </div>
          <p className="pm-docs-card-summary">{fail.explanation}</p>
          <pre className="pm-docs-card-math">{fail.arithmetic}</pre>
          <p className="pm-docs-card-foot">
            <span>{fail.addr1}</span>
            <span>
              {failCount} fail · {reviewCount} review · 6 pages · sample
            </span>
          </p>
        </div>
      </figure>
    </section>
  );
}
