"use client";

import { useState } from "react";
import SheetHead from "@/components/home/sheet-head";
import Tickmark, { Ident, VERDICT_TICK } from "@/components/paper/tickmark";
import { MARKER_TABS, MARKERS, type MarkerCategory } from "@/lib/home-data";

type TabValue = (typeof MARKER_TABS)[number];

const countFor = (t: TabValue) => (t === "All" ? MARKERS.length : MARKERS.filter((m) => m.cat === t).length);

/**
 * The marker catalogue as a ledger with index tabs along its top edge, the
 * way a working-paper file is tabbed by section. Mirrors the live registry
 * exactly (lib/home-data.ts), six rows and no more.
 */
export default function MarkersSection() {
  const [filter, setFilter] = useState<TabValue>("All");
  const shown = filter === "All" ? MARKERS : MARKERS.filter((m) => m.cat === (filter as MarkerCategory));

  return (
    <section id="markers" className="pm-h-section" aria-labelledby="markers-title">
      <div className="pm-wrap">
        <SheetHead
          id="markers-title"
          wp="C"
          title="Six checks. Each one shows its work."
          aside={
            <p>
              Every marker is a narrow rule with a fixed verdict. When one fires, the finding carries the page, the box and the comparison it made, so a
              reviewer can check it by eye.
            </p>
          }
        />

        <div className="pm-tabs" role="group" aria-label="Filter markers by category">
          {MARKER_TABS.map((t) => (
            <button key={t} type="button" className="pm-tab" aria-pressed={t === filter} onClick={() => setFilter(t)}>
              {t}
              <span className="pm-tab-count">{countFor(t)}</span>
            </button>
          ))}
        </div>

        <div className="pm-ledger-wrap pm-ledger-tabbed">
          <table className="pm-ledger pm-h-markers">
            <caption className="pm-sr">Marker catalogue{filter === "All" ? "" : `, ${filter} only`}</caption>
            <thead>
              <tr>
                <th scope="col">Marker</th>
                <th scope="col">Fires when</th>
                <th scope="col">Cites</th>
                <th scope="col">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id}>
                  <th scope="row">
                    <span className="pm-mono pm-h-marker-id">
                      <Ident>{m.id}</Ident>
                    </span>
                    <span className="pm-h-marker-cat">{m.cat}</span>
                  </th>
                  <td>{m.desc}</td>
                  <td className="pm-mono pm-h-marker-cites">{m.cites}</td>
                  <td>
                    <span className="pm-vtag" data-tone={m.verdict}>
                      <Tickmark kind={VERDICT_TICK[m.verdict]} size={15} />
                      {m.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="pm-note">
          <strong>Not checked yet:</strong> producer and template mismatches, and font-metric edits. We don&rsquo;t have the evidence to run them honestly,
          so we don&rsquo;t. A CLEAR verdict means these six checks found nothing, not that the document is authentic.
        </p>
      </div>
    </section>
  );
}
