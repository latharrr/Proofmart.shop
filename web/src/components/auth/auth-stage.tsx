import type { ReactNode } from "react";
import Tickmark from "@/components/paper/tickmark";

// Under each auth form, ruled off inside the same panel: one line about
// what the page leads to, and the finding or points that back it. Static
// markup, so the form never waits on it.

export type StageVerdict = "FAIL" | "REVIEW" | "CLEAR";

export interface AuthStageProps {
  variant: "stack" | "single";
  /** Accepted for older call sites. */
  verdict?: StageVerdict;
  /** Content of the band. */
  band: ReactNode;
  /** The band's mono label. */
  label?: string;
  /** Accepted for older call sites. */
  file?: string;
}

export default function AuthStage({ band, label }: AuthStageProps) {
  return (
    <aside className="pm-auth-stage" aria-label={label}>
      {label ? <p className="pm-auth-stage-label">{label}</p> : null}
      <div className="pm-auth-band">{band}</div>
    </aside>
  );
}

/** Default band: one sentence, then either the finding on show (mono: it is data) or short points. */
export function FindingBand({
  line,
  marker,
  arithmetic,
  points,
}: {
  line: string;
  marker?: string;
  arithmetic?: ReactNode;
  points?: string[];
}) {
  return (
    <>
      <p className="pm-auth-band-line pm-t-heading-sm">{line}</p>
      {marker && (
        <div className="pm-auth-band-finding">
          <span className="pm-t-mono pm-auth-band-marker">{marker}</span>
          {arithmetic && <span className="pm-t-mono pm-auth-band-arith">{arithmetic}</span>}
        </div>
      )}
      {points && (
        <ul className="pm-auth-band-points">
          {points.map((p) => (
            <li key={p} className="pm-t-label">
              {p}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export const SIGNUP_BENEFITS: { lead: string; rest: string }[] = [
  { lead: "50 verify calls", rest: "a month, free" },
  { lead: "Findings pinned", rest: "with their arithmetic" },
  { lead: "A history", rest: "of every document" },
  { lead: "API keys", rest: "for /v1/verify" },
];

export function BenefitList({ className }: { className?: string }) {
  return (
    <ul className={className ? `pm-auth-benefits ${className}` : "pm-auth-benefits"}>
      {SIGNUP_BENEFITS.map((b) => (
        <li key={b.lead}>
          <Tickmark kind="agreed" />
          <span>
            <span className="pm-auth-benefit-lead">{b.lead}</span> {b.rest}
          </span>
        </li>
      ))}
    </ul>
  );
}
