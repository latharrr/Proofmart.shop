"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AnnotationOverlay from "@/components/evidence-rail/annotation-overlay";
import { FACT_LABEL, clampPage, envelopeToRailInputs, factToRailFinding, verdictCounts, verificationFindingToRailFinding } from "@/lib/pdf/rail-adapter";
import { getPageDimensions, loadPdfDocument, renderPageToCanvas, type PageDimensions } from "@/lib/pdf/render";
import type { VerifyEnvelope } from "@/lib/api/envelope";
import type { PdfRect } from "@/lib/pdf/types";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { VERDICT_TONE, VerdictBadge, documentKindLabel, plural, type VerdictValue } from "./verdict";

const CANVAS_TARGET_WIDTH = 1000;
const NARROW = "(max-width: 960px)";

/** One selectable thing in the report — a verification finding or an extracted fact — with the page it lives on. */
interface ReportItem {
  id: string;
  kind: "finding" | "fact";
  verdict: VerdictValue;
  marker: string;
  name: string | null;
  summary: string;
  detail: string | null;
  page: number;
  rect: PdfRect | null;
}

const SEVERITY_RANK: Record<VerdictValue, number> = { FAIL: 0, REVIEW: 1, INCONCLUSIVE: 2, CLEAR: 3 };

function location(item: ReportItem): string {
  return item.rect ? `p${item.page} · ${Math.round(item.rect.x)},${Math.round(item.rect.y)}` : `p${item.page}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A saved document's report. Verdict first, then every finding across every
 * page (most severe first), each with its own arithmetic. The page preview
 * sits beside the list on desktop and below it on a phone; selecting a
 * finding turns to its page and outlines the region it points at.
 */
export default function SavedDocumentViewer({ documentId, envelope, hasStoredFile }: { documentId: string; envelope: VerifyEnvelope; hasStoredFile: boolean }) {
  const { document: doc, verification } = useMemo(() => envelopeToRailInputs(envelope), [envelope]);

  const [page, setPage] = useState(1);
  const [renderedDims, setRenderedDims] = useState<PageDimensions | null>(null);
  const [pdfStage, setPdfStage] = useState<"idle" | "loading" | "ready" | "error">(hasStoredFile ? "loading" : "idle");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const renderChain = useRef<Promise<void>>(Promise.resolve());

  // Fetch the stored PDF once — the findings and verdict are already in
  // `envelope`; only the page image needs this round trip.
  useEffect(() => {
    if (!hasStoredFile) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/file`);
        if (!res.ok) throw new Error("fetch failed");
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const pdf = await loadPdfDocument(buf);
        if (cancelled) return;
        pdfRef.current = pdf;
        const dims = await getPageDimensions(pdf, 1);
        if (cancelled) return;
        setRenderedDims(dims);
        setPdfStage("ready");
      } catch {
        if (!cancelled) setPdfStage("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, hasStoredFile]);

  // Renders are chained, not raced: pdf.js refuses two concurrent renders
  // into one canvas, which is what fast paging would otherwise produce.
  useEffect(() => {
    if (pdfStage !== "ready" || !pdfRef.current || !canvasRef.current) return;
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    let cancelled = false;
    renderChain.current = renderChain.current
      .then(async () => {
        if (cancelled) return;
        const dims = await renderPageToCanvas(pdf, page, canvas, CANVAS_TARGET_WIDTH);
        if (!cancelled) setRenderedDims(dims);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdfStage, page]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setHoveredId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { findings, facts } = useMemo(() => {
    if (!doc || !verification) return { findings: [] as ReportItem[], facts: [] as ReportItem[] };
    const findings: ReportItem[] = verification.findings
      .map((f) => {
        const rail = verificationFindingToRailFinding(f);
        return {
          id: f.id,
          kind: "finding" as const,
          verdict: f.verdict,
          marker: f.markerId,
          name: f.markerName,
          summary: f.evidence.summary,
          detail: f.evidence.detail || null,
          page: f.evidence.coordinates[0]?.page ?? 1,
          rect: rail.rect,
        };
      })
      .sort((a, b) => SEVERITY_RANK[a.verdict] - SEVERITY_RANK[b.verdict] || a.page - b.page);
    const facts: ReportItem[] = doc.facts.map((fact) => {
      const rail = factToRailFinding(fact);
      return {
        id: fact.id,
        kind: "fact" as const,
        verdict: "INCONCLUSIVE" as const,
        marker: FACT_LABEL[fact.kind] ?? fact.kind.toUpperCase(),
        name: null,
        summary: fact.detail,
        detail: null,
        page: fact.page,
        rect: rail.rect,
      };
    });
    return { findings, facts };
  }, [doc, verification]);

  if (!doc || !verification) {
    return (
      <div className="pm-app-notice">
        <p className="pm-app-notice-title">This document has no result to show yet.</p>
        <p className="pm-app-notice-body">Re-run it to produce a report.</p>
      </div>
    );
  }

  const pageCount = Math.max(1, doc.pageCount);
  const counts = verdictCounts(verification);
  const all = [...findings, ...facts];
  const byId = (id: string | null) => (id ? (all.find((i) => i.id === id) ?? null) : null);
  const hovered = byId(hoveredId);
  const selected = byId(selectedId);
  const active = hovered && hovered.page === page ? hovered : selected && selected.page === page ? selected : null;
  const onThisPage = findings.filter((f) => f.page === page).length;

  const pageMeta = doc.pages.find((p) => p.page === page);
  const dims: PageDimensions = renderedDims && pdfStage === "ready" ? renderedDims : pageMeta ? { widthPt: pageMeta.widthPt, heightPt: pageMeta.heightPt } : { widthPt: 612, heightPt: 792 };

  const goToPage = (delta: number) => {
    setPage((current) => clampPage(current, pageCount, delta));
  };

  const select = (item: ReportItem) => {
    const next = selectedId === item.id ? null : item.id;
    setSelectedId(next);
    if (next) {
      setPage(item.page);
      if (window.matchMedia(NARROW).matches) {
        previewRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }
    }
  };

  const backToSelected = () => {
    if (!selectedId) return;
    const el = document.getElementById(`finding-${selectedId}`);
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const tone = VERDICT_TONE[verification.verdict];
  const sentence =
    verification.verdict === "FAIL"
      ? `${plural(counts.fail, "finding")} failed a check. Read the evidence before you rely on this document.`
      : verification.verdict === "REVIEW"
        ? `Nothing failed, but ${plural(counts.review, "finding")} ${counts.review === 1 ? "needs" : "need"} a person to look at it.`
        : verification.verdict === "CLEAR"
          ? `Every marker that could run came back clean — ${plural(verification.markersRun.length, "marker")} ran.`
          : "There wasn't enough structure in this document to reach a verdict.";

  const renderItem = (item: ReportItem) => {
    const isSelected = item.id === selectedId;
    return (
      <li key={item.id}>
        <button
          id={`finding-${item.id}`}
          type="button"
          className="pm-finding"
          data-kind={item.kind}
          data-verdict={item.verdict}
          data-active={active?.id === item.id || undefined}
          aria-pressed={isSelected}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          onFocus={() => setHoveredId(item.id)}
          onBlur={() => setHoveredId(null)}
          onClick={() => select(item)}
        >
          <span className="pm-finding-top">
            <span className="pm-finding-marker">{item.marker}</span>
            {item.kind === "finding" ? <VerdictBadge verdict={item.verdict} /> : <span className="pm-finding-loc-inline">{location(item)}</span>}
          </span>
          {item.name && <span className="pm-finding-name">{item.name}</span>}
          <span className="pm-finding-summary">{item.summary}</span>
          {item.detail && <span className="pm-finding-math">{item.detail}</span>}
          {item.kind === "finding" && (
            <span className="pm-finding-foot">
              <span className="pm-finding-loc">{location(item)}</span>
              <span className="pm-finding-show">{isSelected ? "Shown on page" : item.rect ? "Show on page" : `Go to page ${item.page}`}</span>
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="pm-report" data-testid="saved-document-report">
      <section className="pm-report-summary" aria-label="Verdict">
        <div className="pm-report-verdict">
          <p className="pm-eyebrow" style={{ margin: 0 }}>
            Verdict
          </p>
          <p className="pm-report-verdict-word" style={{ color: tone.color }}>
            <span aria-hidden="true" className="pm-report-verdict-glyph">
              {tone.glyph}
            </span>
            {tone.label}
          </p>
          <p className="pm-report-verdict-line">{sentence}</p>
        </div>
        <dl className="pm-report-stats">
          <div data-verdict="FAIL" data-zero={counts.fail === 0 || undefined}>
            <dt>Failed</dt>
            <dd>{counts.fail}</dd>
          </div>
          <div data-verdict="REVIEW" data-zero={counts.review === 0 || undefined}>
            <dt>Need review</dt>
            <dd>{counts.review}</dd>
          </div>
          <div data-verdict="CLEAR" data-zero={counts.clear === 0 || undefined}>
            <dt>Markers clear</dt>
            <dd>{counts.clear}</dd>
          </div>
          <div className="pm-report-stats-doc">
            <dt>Document</dt>
            <dd>
              {documentKindLabel(verification.documentKind)}
              <span className="pm-report-stats-sub">
                {plural(pageCount, "page")} · <span className="pm-mono">{doc.pdfType}</span>
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="pm-report-body">
        <section className="pm-report-findings" aria-labelledby="pm-findings-h">
          <div className="pm-report-section-head">
            <h2 id="pm-findings-h" className="pm-eyebrow" style={{ margin: 0 }}>
              Findings
            </h2>
            <span className="pm-report-section-count">{findings.length === 0 ? "None" : plural(findings.length, "finding")}</span>
          </div>

          {findings.length === 0 ? (
            <div className="pm-report-clean">
              <VerdictBadge verdict={verification.verdict === "CLEAR" ? "CLEAR" : "INCONCLUSIVE"} />
              <p>
                No marker found anything to report. {plural(verification.markersRun.length, "marker")} ran against this document
                {verification.markersSkipped.length > 0 ? `; ${verification.markersSkipped.length} couldn't run (listed below).` : "."}
              </p>
            </div>
          ) : (
            <ol className="pm-findings">{findings.map(renderItem)}</ol>
          )}

          {verification.markersSkipped.length > 0 && (
            <details className="pm-report-more">
              <summary>
                Markers that couldn&apos;t run <span className="pm-report-more-n">{verification.markersSkipped.length}</span>
              </summary>
              <ul className="pm-skipped">
                {verification.markersSkipped.map((m) => (
                  <li key={m.markerId}>
                    <span className="pm-mono">{m.markerId}</span>
                    <span>{m.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {facts.length > 0 && (
            <details className="pm-report-more">
              <summary>
                Extracted from the document <span className="pm-report-more-n">{facts.length}</span>
              </summary>
              <p className="pm-report-more-note">Structure the pipeline read off the page. These are not findings and carry no verdict.</p>
              <ol className="pm-findings pm-findings-facts">{facts.map(renderItem)}</ol>
            </details>
          )}
        </section>

        <aside ref={previewRef} className="pm-report-page" aria-label="Page preview">
          <div className="pm-report-page-card pm-artifact">
            <div className="pm-report-page-bar">
              <span className="pm-report-page-pos" aria-live="polite">
                Page <span className="pm-mono">{page}</span> of <span className="pm-mono">{pageCount}</span>
                {onThisPage > 0 && <span className="pm-report-page-hits"> · {plural(onThisPage, "finding")}</span>}
              </span>
              <span className="pm-report-stepper">
                <button type="button" aria-label="Previous page" onClick={() => goToPage(-1)} disabled={page <= 1}>
                  ‹
                </button>
                <button type="button" aria-label="Next page" onClick={() => goToPage(1)} disabled={page >= pageCount}>
                  ›
                </button>
              </span>
            </div>

            <div className="pm-report-stage-wrap">
              <div className="pm-report-stage" style={{ ["--pm-ar" as string]: `${dims.widthPt / dims.heightPt}`, aspectRatio: `${dims.widthPt} / ${dims.heightPt}` }}>
                {!hasStoredFile && (
                  <p className="pm-report-stage-note">The original PDF wasn&apos;t kept, so there&apos;s no page image to show. The findings are real.</p>
                )}
                {hasStoredFile && pdfStage === "loading" && (
                  <p className="pm-report-stage-note" role="status">
                    Loading page…
                  </p>
                )}
                {hasStoredFile && pdfStage === "error" && <p className="pm-report-stage-note">The stored file couldn&apos;t be loaded. Reload to try again; the findings are unaffected.</p>}
                {hasStoredFile && pdfStage === "ready" && <canvas ref={canvasRef} aria-label={`Page ${page} of ${doc.filename}`} role="img" />}
                {active?.rect && (pdfStage === "ready" || !hasStoredFile) && (
                  <AnnotationOverlay
                    rect={active.rect}
                    color={VERDICT_TONE[active.verdict].color}
                    fill={VERDICT_TONE[active.verdict].fill}
                    viewBoxWidth={dims.widthPt}
                    viewBoxHeight={dims.heightPt}
                    animationKey={active.id}
                  />
                )}
              </div>
            </div>

            <div className="pm-report-page-foot">
              <span>{active ? <><span className="pm-mono">{active.marker}</span> outlined on this page</> : "Select a finding to outline it on the page."}</span>
              {selectedId && (
                <button type="button" className="pm-link pm-report-back" onClick={backToSelected}>
                  Back to finding
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
