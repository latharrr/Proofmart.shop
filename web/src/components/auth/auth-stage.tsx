import type { ReactNode } from "react";
import Frame from "@/components/motion/frame";
import Reveal from "@/components/motion/reveal";
import { ScrollVar } from "@/components/motion/scroll-progress";
import DocumentStage from "@/components/three/document-stage";

// The one depth moment on each auth page: the product itself, a statement
// under examination in real-time 3D, in a framed graphite stage beside the
// form (desktop) or after it (mobile). It never holds up the task: the poster
// is a still of the same scene, three.js loads lazily behind it, and the form
// never waits on either.

export type StageVerdict = "FAIL" | "REVIEW" | "CLEAR";

export interface AuthStageProps {
  variant: "stack" | "single";
  verdict?: StageVerdict;
  /** Content of the band under the scene. */
  band: ReactNode;
  /** Centred in the bottom crosshair row. */
  label?: string;
  /** File line at the top of the stage. */
  file?: string;
}

const SCENE_LABEL: Record<StageVerdict, string> = {
  FAIL: "A bank statement under examination in 3D: one row is boxed in red and marked FAIL.",
  REVIEW: "A bank statement under examination in 3D: one row is boxed and marked REVIEW.",
  CLEAR: "A bank statement under examination in 3D, marked CLEAR.",
};

export default function AuthStage({ variant, verdict = "FAIL", band, label, file = "northwind_apr26_statement.pdf" }: AuthStageProps) {
  return (
    <ScrollVar range="enter" className="pm-auth-stage-scroll">
      <Frame
        as="aside"
        columns={2}
        tone="graphite"
        label={label}
        className="pm-auth-stage pm-scroll-tilt"
        stageClassName="pm-auth-stage-box"
      >
        <div className="pm-auth-stage-head" aria-hidden="true">
          <span className="pm-t-mono">{file}</span>
          <span className="pm-t-mono">{variant === "stack" ? "3 pages · p4 open" : "p4 / 6"}</span>
        </div>
        <div className="pm-auth-scene" data-variant={variant}>
          <DocumentStage
            variant={variant}
            tone="graphite"
            verdict={verdict}
            preload
            label={SCENE_LABEL[verdict]}
          />
        </div>
        <Reveal delay={240} className="pm-auth-band">
          {band}
        </Reveal>
      </Frame>
    </ScrollVar>
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
            <span className="pm-auth-benefit-lead">{b.lead}</span> {b.rest}
          </span>
        </li>
      ))}
    </ul>
  );
}
