"use client";

import { useState } from "react";
import { MONO, SANS, VERDICT } from "@/lib/evidence-data";
import { MARKER_TABS, MARKERS, type MarkerCategory } from "@/lib/home-data";

type TabValue = (typeof MARKER_TABS)[number];

export default function MarkersSection() {
  const [markerFilter, setMarkerFilter] = useState<TabValue>("All");

  const filtered = markerFilter === "All" ? MARKERS : MARKERS.filter((m) => m.cat === (markerFilter as MarkerCategory));

  return (
    <section id="markers" style={{ borderTop: "1px solid #DDE1E4" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "88px 32px" }}>
        <div
          className="pm-split-grid-57"
          style={{
            display: "grid",
            gap: 56,
            marginBottom: 48,
            alignItems: "end",
          }}
        >
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.1em", marginBottom: 12 }}>§ 03 · CATALOG</div>
            <h2 className="pm-h2" style={{ fontFamily: SANS, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.025em", margin: 0 }}>
              Every marker
              <br />
              is a rule with a citation.
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", justifyContent: "flex-end" }}>
            {MARKER_TABS.map((t) => {
              const active = t === markerFilter;
              return (
                <button
                  key={t}
                  onClick={() => setMarkerFilter(t)}
                  className="pm-hoverable"
                  style={{
                    padding: "6px 12px",
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    color: active ? "#F5F5F0" : "#43494F",
                    background: active ? "#0E1216" : "#FFFFFF",
                    border: "1px solid " + (active ? "#0E1216" : "#DDE1E4"),
                    borderRadius: 3,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #DDE1E4", overflowX: "auto" }}>
          {filtered.map((m, i) => {
            const v = VERDICT[m.verdict];
            return (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 2.6fr 1fr 1.2fr 1.2fr",
                  columnGap: 24,
                  alignItems: "center",
                  padding: "18px 0",
                  borderBottom: "1px solid #DDE1E4",
                  minWidth: 640,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.1em" }}>{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, letterSpacing: "0.01em" }}>{m.id}</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: "#43494F", marginTop: 4, lineHeight: 1.4 }}>{m.desc}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", letterSpacing: "0.04em" }}>{m.cat.toUpperCase()}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 12, textAlign: "center", fontFamily: MONO, fontSize: 12, color: v.color, fontWeight: 500 }}>{v.glyph}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: v.color }}>{m.verdict}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", letterSpacing: "0.02em", textAlign: "right" }}>
                  cites · <span style={{ color: "#0E1216" }}>{m.cites}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.04em" }}>
          <span>Six representative markers · full catalog under /docs/markers</span>
          <a href="#catalog" className="pm-hoverable" style={{ color: "#0E1216" }}>
            read the catalog →
          </a>
        </div>
      </div>
    </section>
  );
}
