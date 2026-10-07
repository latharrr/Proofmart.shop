import Reveal from "@/components/home/reveal";
import { FINDINGS } from "@/lib/evidence-data";

// The right-hand half of the auth pages at desktop width. It is the same
// product the marketing page shows — the hero's lead finding, floating over
// the statement page it was pinned to — so signing in reads as stepping into
// that product, not onto a separate form.
//
// The crop is structural: the page preview runs off the right and bottom
// edges of the viewport through its own blank margin and skeleton rows, while
// the finding (marker, explanation, arithmetic, coordinates) and the pinned
// box stay wholly inside.

const LEAD = FINDINGS[0];

export const SIGNUP_BENEFITS: { lead: string; rest: string }[] = [
  { lead: "50 verify calls a month", rest: "on the free plan." },
  { lead: "Every finding pinned to the page,", rest: "with its arithmetic." },
  { lead: "A history", rest: "of every document you’ve checked." },
  { lead: "API keys", rest: "to call /v1/verify from your code." },
];

/** Bars standing in for statement rows. Widths are fractions of each column. */
const ROWS: number[][] = [
  [1, 0.82, 0, 0.9, 0.7],
  [1, 0.64, 0.7, 0.86, 0.9],
  [1, 0.9, 0.55, 0.92, 0.6],
  [1, 0.58, 0, 0.88, 0.8],
  [1, 0.74, 0.8, 0.9, 0.75],
  [1, 0.86, 0, 0.84, 0.95],
  [1, 0.62, 0.66, 0.9, 0.65],
  [1, 0.8, 0, 0.94, 0.85], // r17 — the row the finding is pinned to
  [1, 0.7, 0.6, 0.86, 0.7],
  [1, 0.9, 0, 0.9, 0.9],
  [1, 0.66, 0.74, 0.88, 0.6],
  [1, 0.78, 0, 0.92, 0.8],
  [1, 0.6, 0.58, 0.86, 0.72],
  [1, 0.84, 0, 0.9, 0.88],
  [1, 0.72, 0.7, 0.88, 0.66],
  [1, 0.88, 0, 0.92, 0.9],
  [1, 0.68, 0.62, 0.9, 0.78],
  [1, 0.8, 0, 0.86, 0.7],
  [1, 0.74, 0.7, 0.92, 0.84],
  [1, 0.62, 0, 0.88, 0.62],
  [1, 0.86, 0.58, 0.9, 0.9],
  [1, 0.7, 0, 0.94, 0.74],
];
const PINNED_ROW = 7;

function PagePreview() {
  return (
    <div className="pm-auth-page" aria-hidden="true">
      <div className="pm-auth-page-head">
        <span className="pm-mono" style={{ color: "var(--pm-ink)" }}>
          hdfc_apr25_statement.pdf
        </span>
        <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
          p4 / 6
        </span>
      </div>
      <div className="pm-auth-page-meta">
        <span className="pm-auth-bar" style={{ width: 72 }} />
        <span className="pm-auth-bar" style={{ width: 120 }} />
        <span className="pm-auth-bar" style={{ width: 88 }} />
      </div>
      <div className="pm-auth-page-rows">
        {ROWS.map((r, i) => (
          <div key={i} className="pm-auth-page-row">
            <span className="pm-auth-bar" style={{ width: 36 * r[0] }} />
            <span className="pm-auth-bar" style={{ width: 132 * r[1] }} />
            <span
              className="pm-auth-bar"
              style={{ width: 56 * r[2], opacity: r[2] ? 1 : 0 }}
            />
            <span className="pm-auth-cell">
              <span className="pm-auth-bar" style={{ width: 64 * r[3] }} />
              {i === PINNED_ROW && <span className="pm-auth-pin" />}
            </span>
            <span className="pm-auth-bar" style={{ width: 150 * r[4] }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingCard() {
  return (
    <div className="pm-artifact pm-auth-finding">
      <span className="pm-auth-finding-edge" aria-hidden="true" />
      <div className="pm-auth-finding-head">
        <span className="pm-mono" style={{ color: "var(--pm-ink)" }}>
          {LEAD.marker}
        </span>
        <span className="pm-mono pm-auth-verdict">{LEAD.verdict}</span>
      </div>
      <p className="pm-body" style={{ margin: "0 0 12px" }}>
        {LEAD.explanation}
      </p>
      <pre className="pm-mono pm-auth-arith">{LEAD.arithmetic}</pre>
      <div
        className="pm-mono"
        style={{ color: "var(--pm-ash)", marginTop: 10 }}
      >
        {LEAD.addr1} · box {LEAD.rect.x},{LEAD.rect.y}
      </div>
    </div>
  );
}

export default function AuthAside({
  variant,
}: {
  variant: "return" | "signup";
}) {
  return (
    <aside
      className="pm-auth-aside"
      aria-label={
        variant === "signup"
          ? "What you get with an account"
          : "About ProofMart"
      }
    >
      <div className="pm-auth-aside-inner">
        <div className="pm-auth-aside-copy">
          {variant === "signup" ? (
            <>
              <p className="pm-eyebrow" style={{ marginBottom: 12 }}>
                Free plan · ₹0 / month
              </p>
              <h2 className="pm-auth-aside-title" style={{ marginBottom: 20 }}>
                What you get with an account
              </h2>
              <BenefitList />
            </>
          ) : (
            <>
              <p className="pm-eyebrow" style={{ marginBottom: 12 }}>
                Document forensics · API
              </p>
              <h2 className="pm-auth-aside-title" style={{ marginBottom: 12 }}>
                Your reports are where you left them.
              </h2>
              <p
                className="pm-body"
                style={{ color: "var(--pm-slate)", maxWidth: "40ch" }}
              >
                Every finding pinned to its box on the page, with the arithmetic
                behind the verdict.
              </p>
            </>
          )}
        </div>

        <div className="pm-auth-stage" data-variant={variant}>
          <Reveal className="pm-auth-stage-page">
            <PagePreview />
          </Reveal>
          <Reveal delay={300} className="pm-auth-stage-finding">
            <FindingCard />
          </Reveal>
        </div>
      </div>
    </aside>
  );
}

export function BenefitList({ compact }: { compact?: boolean }) {
  return (
    <ul className="pm-auth-benefits" data-compact={compact || undefined}>
      {SIGNUP_BENEFITS.map((b) => (
        <li key={b.lead}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3.5 8.4 6.6 11.4 12.5 4.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            <strong>{b.lead}</strong> {b.rest}
          </span>
        </li>
      ))}
    </ul>
  );
}
