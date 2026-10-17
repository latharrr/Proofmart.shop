import type { ReactNode } from "react";
import Frame from "@/components/motion/frame";

/**
 * A request and its answer, as two sheets clipped together: the request on
 * the lighter sheet with its label ruled along the foot, and the answer set
 * on the pad directly beneath it, offset to the right the way a reply is
 * stapled under the letter it answers.
 */
export default function DepthStage({
  label,
  children,
  float,
  floatLabel,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  /** The answer: the response, the check. */
  float?: ReactNode;
  /** A mono caption above the answer, e.g. "response". */
  floatLabel?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `pm-acct-depth ${className}` : "pm-acct-depth"}>
      <Frame tone="sheet" label={label} className="pm-acct-depth-frame" stageClassName="pm-acct-depth-stage">
        {children}
      </Frame>
      {float ? (
        <div className="pm-acct-depth-float">
          {floatLabel ? <span className="pm-mono pm-acct-depth-slot-label">{floatLabel}</span> : null}
          {float}
        </div>
      ) : null}
    </div>
  );
}
