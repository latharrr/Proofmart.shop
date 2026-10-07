import type { ReactNode } from "react";
import Frame from "@/components/motion/frame";
import Tilt from "@/components/motion/tilt";
import Reveal from "@/components/motion/reveal";

/**
 * The account pages' one depth moment (bar.md, "App pages are tools"): a
 * graphite stage on the crosshair frame holding the request, with the
 * response floating on its own plane 56px in front of it. Pointer tilt
 * (≤ 6°, damped, flat on leave) makes the two planes part in real
 * perspective, so what you send and what comes back read as two layers of
 * one exchange. Off for touch and reduced motion: then it's a still,
 * composed frame.
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
  /** The plane in front: the response, the check. */
  float?: ReactNode;
  /** A mono caption above the reserved float area, e.g. "response". */
  floatLabel?: ReactNode;
  className?: string;
}) {
  return (
    <Tilt max={6} damping={8} className={className ? `pm-acct-depth ${className}` : "pm-acct-depth"} innerClassName="pm-acct-depth-inner">
      <Frame tone="graphite" columns={4} label={label} className="pm-acct-depth-frame" stageClassName="pm-acct-depth-stage">
        {children}
        {float ? (
          <div className="pm-acct-depth-slot" aria-hidden="true">
            {floatLabel ? <span className="pm-t-mono pm-acct-depth-slot-label">{floatLabel}</span> : null}
          </div>
        ) : null}
      </Frame>
      {float ? (
        <div className="pm-acct-depth-float">
          <Reveal delay={420}>{float}</Reveal>
        </div>
      ) : null}
    </Tilt>
  );
}
