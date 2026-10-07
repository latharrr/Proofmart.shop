"use client";

import { useState } from "react";
import Reveal from "@/components/home/reveal";
import { MARKER_TABS, MARKERS, type MarkerCategory, type MarkerVerdict } from "@/lib/home-data";

type TabValue = (typeof MARKER_TABS)[number];

// Verdict colour is functional signal, not decoration — it is the one place
// this page is allowed a saturated hue, and it never appears anywhere else.
const VERDICT_COLOR: Record<MarkerVerdict, string> = {
  FAIL: "var(--pm-fail)",
  REVIEW: "var(--pm-review)",
  CLEAR: "var(--pm-clear)",
};

const VERDICT_GLYPH: Record<MarkerVerdict, string> = { FAIL: "×", REVIEW: "~", CLEAR: "=" };

const countFor = (t: TabValue) => (t === "All" ? MARKERS.length : MARKERS.filter((m) => m.cat === t).length);

export default function MarkersSection() {
  const [markerFilter, setMarkerFilter] = useState<TabValue>("All");

  const filtered = markerFilter === "All" ? MARKERS : MARKERS.filter((m) => m.cat === (markerFilter as MarkerCategory));

  return (
    <section id="markers" className="pm-band-fog">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">02 · What it catches</p>
            <h2 className="pm-h2">Six checks. Each one shows its work.</h2>
          </div>
          <p className="pm-lead">
            Every marker is a narrow rule with a fixed verdict. When one fires, the finding carries the page, the box and the comparison it made — so a
            reviewer can check it by eye.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="pm-tabs" role="group" aria-label="Filter markers by category">
            {MARKER_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMarkerFilter(t)}
                className="pm-tab"
                data-active={t === markerFilter ? "true" : "false"}
                aria-pressed={t === markerFilter}
              >
                {t}
                <span className="pm-tab-count">{countFor(t)}</span>
              </button>
            ))}
          </div>

          <div className="pm-marker-head" aria-hidden="true">
            <span>Marker</span>
            <span>Fires when</span>
            <span>Category</span>
            <span>Verdict</span>
          </div>
          <ul className="pm-marker-list">
            {filtered.map((m) => (
              <li key={m.id} className="pm-marker-row pm-marker-grid" style={{ ["--pm-v" as string]: VERDICT_COLOR[m.verdict] }}>
                <span className="pm-mono pm-marker-id">{m.id}</span>
                <div className="pm-marker-desc">
                  <p className="pm-body" style={{ color: "var(--pm-ink)" }}>
                    {m.desc}
                  </p>
                  <p className="pm-mono" style={{ color: "var(--pm-ash)", marginTop: 4 }}>
                    cites {m.cites}
                  </p>
                </div>
                <span className="pm-caption pm-marker-cat">{m.cat}</span>
                <span className="pm-mono pm-marker-verdict" style={{ color: VERDICT_COLOR[m.verdict] }}>
                  {VERDICT_GLYPH[m.verdict]} {m.verdict}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="pm-marker-foot">
          <p className="pm-caption" style={{ color: "var(--pm-slate)" }}>
            <span style={{ color: "var(--pm-ink)" }}>Not checked yet:</span> producer and template mismatches, and font-metric edits. We don&rsquo;t
            have the evidence to run them honestly, so we don&rsquo;t. A CLEAR verdict means these six checks found nothing — not that the document
            is authentic.
          </p>
        </div>
      </div>
    </section>
  );
}
