import Link from "next/link";
import { FINDINGS } from "@/lib/evidence-data";
import { VERIFY_HREF } from "@/components/app/app-shell";
import { VerdictBadge } from "./verdict";

/**
 * First-run state for My documents: what to do (three steps, one primary
 * action) beside what you get back (a sample report, labelled as one). The
 * sample is the same bundled statement the home page's Evidence Rail opens
 * with, so the two never disagree about what a finding looks like.
 *
 * The sample floats free on the page field and runs off the viewport's right
 * edge through its page preview — a column of placeholder lines with no text
 * in it — so the crop never touches a number, a marker id or the arithmetic.
 */
export default function DocumentsEmpty() {
  const fail = FINDINGS.find((f) => f.verdict === "FAIL") ?? FINDINGS[0];
  const review = FINDINGS.find((f) => f.verdict === "REVIEW") ?? FINDINGS[1];
  const failCount = FINDINGS.filter((f) => f.verdict === "FAIL").length;
  const reviewCount = FINDINGS.filter((f) => f.verdict === "REVIEW").length;

  return (
    <section className="pm-empty" aria-labelledby="pm-empty-title" data-testid="documents-empty">
      <div className="pm-empty-text">
        <p className="pm-eyebrow" style={{ marginBottom: 12 }}>
          No documents yet
        </p>
        <h2 id="pm-empty-title" className="pm-empty-lead">
          Verify your first PDF and its report is saved here, private to your account.
        </h2>

        <ol className="pm-empty-steps">
          <li>
            <span className="pm-empty-step-n" aria-hidden="true">
              1
            </span>
            <div>
              <span className="pm-empty-step-title">Upload a PDF</span>
              <span className="pm-empty-step-body">A bank statement, invoice, salary slip or payment proof. Drop it on the verifier while you&apos;re signed in.</span>
            </div>
          </li>
          <li>
            <span className="pm-empty-step-n" aria-hidden="true">
              2
            </span>
            <div>
              <span className="pm-empty-step-title">Every marker checks the numbers</span>
              <span className="pm-empty-step-body">Running balances, totals carried between pages, duplicate rows — each check shows the arithmetic it did.</span>
            </div>
          </li>
          <li>
            <span className="pm-empty-step-n" aria-hidden="true">
              3
            </span>
            <div>
              <span className="pm-empty-step-title">The report lands on this page</span>
              <span className="pm-empty-step-body">One verdict, every finding pinned to its spot on the page. Open, re-run or delete it whenever you like.</span>
            </div>
          </li>
        </ol>

        <div className="pm-empty-cta">
          <Link href={VERIFY_HREF} className="pm-btn pm-btn-filled">
            Verify a document
          </Link>
          <Link href="/#markers" className="pm-link">
            See what gets checked
            <span className="pm-arrow" aria-hidden="true">
              <span>→</span>
            </span>
          </Link>
        </div>
      </div>

      <figure className="pm-empty-figure" aria-label="Example of a saved report">
        <figcaption className="pm-empty-caption">Example report</figcaption>
        <div className="pm-sample pm-artifact" aria-hidden="true">
          <div className="pm-sample-findings">
            <div className="pm-sample-head">
              <span className="pm-sample-file">hdfc_apr25_statement.pdf</span>
              <VerdictBadge verdict="FAIL" />
            </div>
            <div className="pm-sample-counts">
              <span data-verdict="FAIL">{failCount} fail</span>
              <span data-verdict="REVIEW">{reviewCount} review</span>
              <span>6 pages · Bank statement</span>
            </div>

            <div className="pm-sample-finding" data-verdict="FAIL">
              <div className="pm-sample-finding-top">
                <span className="pm-sample-marker">{fail.marker}</span>
                <span className="pm-sample-addr">{fail.addr1}</span>
              </div>
              <p className="pm-sample-summary">{fail.explanation}</p>
              <pre className="pm-sample-math">{fail.arithmetic}</pre>
            </div>
            <div className="pm-sample-finding" data-verdict="REVIEW">
              <div className="pm-sample-finding-top">
                <span className="pm-sample-marker">{review.marker}</span>
                <span className="pm-sample-addr">{review.addr1}</span>
              </div>
              <p className="pm-sample-summary">{review.explanation}</p>
            </div>
          </div>

          <div className="pm-sample-page">
            <div className="pm-sample-sheet">
              {Array.from({ length: 15 }, (_, i) => (
                <span key={i} className="pm-sample-line" data-hit={i === 10 ? "fail" : i === 4 ? "review" : undefined} style={{ width: `${[92, 70, 84, 64, 88, 78, 90, 60, 82, 74, 86, 80, 68, 90, 76, 58, 84, 72][i]}%` }} />
              ))}
            </div>
          </div>
        </div>
      </figure>
    </section>
  );
}
