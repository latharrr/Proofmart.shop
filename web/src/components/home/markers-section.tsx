"use client";

import { useState } from "react";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import SectionKicker from "@/components/home/section-kicker";
import { MARKER_TABS, MARKERS, type MarkerCategory, type MarkerVerdict } from "@/lib/home-data";

type TabValue = (typeof MARKER_TABS)[number];

const GLYPH: Record<MarkerVerdict, string> = { FAIL: "×", REVIEW: "~", CLEAR: "=" };

const countFor = (t: TabValue) => (t === "All" ? MARKERS.length : MARKERS.filter((m) => m.cat === t).length);

export default function MarkersSection() {
  const [filter, setFilter] = useState<TabValue>("All");
  const shown = filter === "All" ? MARKERS : MARKERS.filter((m) => m.cat === (filter as MarkerCategory));

  return (
    <section id="markers" className="pm-mk-section pm-mk-markers" aria-labelledby="markers-title">
      <div className="pm-wrap pm-mk-markers-grid">
        <div className="pm-mk-markers-side">
          <SectionKicker n="03">What it catches</SectionKicker>
          <LineReveal as="h2" id="markers-title" className="pm-t-heading-lg">
            Six checks. <br />
            Each one shows <br />
            its work.
          </LineReveal>
          <Reveal as="p" className="pm-t-body-lg pm-mk-lead">
            Every marker is a narrow rule with a fixed verdict. When one fires, the finding carries the page, the box and the comparison it made, so a
            reviewer can check it by eye.
          </Reveal>
          <Reveal delay={80} className="pm-mk-tabs" role="group" aria-label="Filter markers by category">
            {MARKER_TABS.map((t) => (
              <button key={t} type="button" className="pm-mk-tab" data-active={t === filter ? "true" : "false"} aria-pressed={t === filter} onClick={() => setFilter(t)}>
                <span>{t}</span>
                <span className="pm-mk-tab-n">{countFor(t)}</span>
              </button>
            ))}
          </Reveal>
        </div>

        <div className="pm-mk-markers-list">
          <div className="pm-mk-marker-head" aria-hidden="true">
            <span>Marker</span>
            <span>Fires when</span>
            <span>Verdict</span>
          </div>
          <ul>
            {shown.map((m, i) => (
              <Reveal as="li" key={m.id} delay={i * 80} className="pm-mk-marker">
                <span className="pm-mk-marker-id">
                  <span className="pm-t-mono">{m.id}</span>
                  <span className="pm-mk-marker-cat">{m.cat}</span>
                </span>
                <span className="pm-mk-marker-desc">
                  <span className="pm-t-body">{m.desc}</span>
                  <span className="pm-t-mono pm-mk-marker-cites">cites {m.cites}</span>
                </span>
                <span className="pm-mk-verdict" data-tone={m.verdict}>
                  <span aria-hidden="true">{GLYPH[m.verdict]}</span>
                  {m.verdict}
                </span>
              </Reveal>
            ))}
          </ul>
          <p className="pm-mk-note pm-mk-markers-foot">
            <strong>Not checked yet:</strong> producer and template mismatches, and font-metric edits. We don&rsquo;t have the evidence to run them
            honestly, so we don&rsquo;t. A CLEAR verdict means these six checks found nothing, not that the document is authentic.
          </p>
        </div>
      </div>
    </section>
  );
}
