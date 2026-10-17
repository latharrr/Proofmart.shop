import type { ReactNode } from "react";
import Frame from "@/components/motion/frame";
import StatementSheet from "@/components/paper/statement-sheet";
import Tickmark from "@/components/paper/tickmark";

// Beside each auth form (after it on a phone): the product itself, the
// sample statement re-footed on its working paper, with one line under it
// about what the page leads to. It is static markup, so the form never waits
// on it.

export type StageVerdict = "FAIL" | "REVIEW" | "CLEAR";

export interface AuthStageProps {
  variant: "stack" | "single";
  /** Accepted for older call sites; the sheet always shows page 4 as audited. */
  verdict?: StageVerdict;
  /** Content of the band under the scene. */
  band: ReactNode;
  /** Centred in the bottom crosshair row. */
  label?: string;
  /** File line at the top of the stage. */
  file?: string;
}

export default function AuthStage({ variant, band, label, file = "hdfc_apr25_statement.pdf" }: AuthStageProps) {
  return (
    <Frame as="aside" tone="sheet" label={label} className="pm-auth-stage" stageClassName="pm-auth-stage-box">
      <div className="pm-auth-stage-head" aria-hidden="true">
        <span className="pm-mono">{file}</span>
        <span className="pm-mono">{variant === "stack" ? "6 pages · p4 open" : "p4 / 6"}</span>
      </div>
      <StatementSheet className="pm-auth-sheet" showNotes={false} />
      <div className="pm-auth-band">{band}</div>
    </Frame>
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
