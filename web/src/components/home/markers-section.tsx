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

export default function MarkersSection() {
  const [markerFilter, setMarkerFilter] = useState<TabValue>("All");

  const filtered = markerFilter === "All" ? MARKERS : MARKERS.filter((m) => m.cat === (markerFilter as MarkerCategory));

  return (
    <section id="markers" className="pm-band-fog">
      <div className="pm-shell pm-section">
        <Reveal className="pm-section-head">
          <div>
            <p className="pm-eyebrow">§ 03 · Catalog</p>
            <h2 className="pm-h2">Every marker is a rule with a citation.</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MARKER_TABS.map((t) => (
              <button key={t} type="button" onClick={() => setMarkerFilter(t)} className="pm-tab" data-active={t === markerFilter ? "true" : "false"}>
                {t}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div style={{ borderTop: "1px solid var(--pm-hairline)" }}>
            {filtered.map((m) => (
              <div
                key={m.id}
                className="pm-marker-row pm-marker-grid"
                style={{ padding: "20px 16px", borderBottom: "1px solid var(--pm-hairline)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span aria-hidden="true" style={{ width: 3, height: 20, borderRadius: "var(--pm-r-pill)", background: VERDICT_COLOR[m.verdict], flex: "none" }} />
                  <span className="pm-mono" style={{ color: "var(--pm-ink)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.id}
                  </span>
                </div>
                <div>
                  <p className="pm-body" style={{ color: "var(--pm-slate)" }}>
                    {m.desc}
                  </p>
                  <p className="pm-mono" style={{ color: "var(--pm-ash)", marginTop: 6 }}>
                    cites {m.cites}
                  </p>
                </div>
                <span className="pm-mono" style={{ color: "var(--pm-ash)" }}>
                  {m.cat}
                </span>
                <span className="pm-mono" style={{ color: VERDICT_COLOR[m.verdict], whiteSpace: "nowrap" }}>
                  {VERDICT_GLYPH[m.verdict]} {m.verdict}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        <p className="pm-body" style={{ marginTop: 24, color: "var(--pm-ash)" }}>
          These are the only six markers the verification engine runs today. No others exist yet. Every one of them cites the row, the page and the
          coordinate box it fired on.
        </p>
      </div>
    </section>
  );
}
