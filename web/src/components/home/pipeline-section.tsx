import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import { ScrollVar } from "@/components/motion/scroll-progress";
import Ribbon from "@/components/home/ribbon";
import SectionKicker from "@/components/home/section-kicker";
import { PIPELINE } from "@/lib/home-data";

// A ribbon that enters low-left, loops up behind the heading and exits right.
const RIBBON = "M -60 430 C 180 470, 300 300, 470 250 S 760 330, 880 210 S 1040 30, 1180 120 S 1360 360, 1520 250";

export default function PipelineSection() {
  return (
    <section id="pipeline" className="pm-mk-section pm-mk-pipeline" aria-labelledby="pipeline-title">
      <Ribbon d={RIBBON} className="pm-mk-pipeline-ribbon" />
      <div className="pm-wrap">
        <div className="pm-mk-head pm-mk-head-split">
          <div>
            <SectionKicker n="02">How it works</SectionKicker>
            <LineReveal as="h2" id="pipeline-title" className="pm-t-heading-lg">
              Four passes, <br />
              bytes to verdict.
            </LineReveal>
          </div>
          <div className="pm-mk-head-aside">
            <Reveal as="p" className="pm-t-body-lg pm-mk-lead">
              Every pass writes to the same address space (page, x, y), so each finding points at the exact glyphs that produced it. Same bytes in,
              same result out, every time.
            </Reveal>
          </div>
        </div>

        <ScrollVar as="ol" range="enter" className="pm-mk-steps">
          {PIPELINE.map((p, i) => (
            <li key={p.i} className="pm-mk-step" style={{ ["--i" as string]: i }}>
              <div className="pm-mk-step-top">
                <span className="pm-t-label">{p.i}</span>
                <span className="pm-t-mono pm-mk-step-ms">{p.ms}</span>
              </div>
              <h3 className="pm-t-heading pm-mk-step-name">{p.name}</h3>
              <p className="pm-t-body pm-mk-step-body">{p.body}</p>
              <ul className="pm-mk-step-signal" aria-label="Writes">
                {p.signal.split(" · ").map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ))}
        </ScrollVar>

        <Reveal as="p" className="pm-mk-note">
          Timings are from the sample scan (<span className="pm-t-mono">req_8fk2</span>, 6 pages, 4.8 s). Real documents vary with length and how many
          pages need OCR.
        </Reveal>
      </div>
    </section>
  );
}
