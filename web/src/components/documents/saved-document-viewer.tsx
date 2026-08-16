"use client";

import { useEffect, useRef, useState } from "react";
import AnnotationOverlay from "@/components/evidence-rail/annotation-overlay";
import { FindingRow } from "@/components/evidence-rail/finding-row";
import { clampPage, envelopeToRailInputs, formatBytes, railFindingsForPage, verdictCounts } from "@/lib/pdf/rail-adapter";
import { getPageDimensions, loadPdfDocument, renderPageToCanvas, type PageDimensions } from "@/lib/pdf/render";
import { MONO, SANS, VERDICT } from "@/lib/evidence-data";
import type { VerifyEnvelope } from "@/lib/api/envelope";
import type { PDFDocumentProxy } from "pdfjs-dist";

const CANVAS_TARGET_WIDTH = 1400;

export default function SavedDocumentViewer({ documentId, envelope, hasStoredFile }: { documentId: string; envelope: VerifyEnvelope; hasStoredFile: boolean }) {
  const { document: doc, verification } = envelopeToRailInputs(envelope);

  const [page, setPage] = useState(1);
  const [pageDims, setPageDims] = useState<PageDimensions | null>(null);
  const [pdfStage, setPdfStage] = useState<"idle" | "loading" | "ready" | "error">(hasStoredFile ? "loading" : "idle");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch the stored PDF once and load it into pdf.js — the findings/verdict
  // data is already known synchronously from `envelope`; only the page
  // image needs this async round trip.
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
        setPageDims(dims);
        setPdfStage("ready");
      } catch {
        if (!cancelled) setPdfStage("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, hasStoredFile]);

  useEffect(() => {
    if (pdfStage !== "ready" || !pdfRef.current || !canvasRef.current) return;
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    let cancelled = false;
    void (async () => {
      const dims = await renderPageToCanvas(pdf, page, canvas, CANVAS_TARGET_WIDTH);
      if (!cancelled) setPageDims(dims);
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfStage, page]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinnedId(null);
        setHoveredId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!doc || !verification) {
    return (
      <div style={{ fontFamily: SANS, fontSize: 14, color: "#767C83", padding: "24px 0" }}>
        This document has no result to show yet.
      </div>
    );
  }

  const findings = railFindingsForPage(doc, verification, page);
  const activeId = hoveredId || pinnedId;
  const activeFinding = findings.find((f) => f.id === activeId) ?? null;
  const counts = verdictCounts(verification);
  const v = VERDICT[verification.verdict];
  const pageCount = Math.max(1, doc.pageCount);

  const goToPage = (delta: number) => {
    setPage((current) => {
      const next = clampPage(current, pageCount, delta);
      if (next !== current) {
        setPinnedId(null);
        setHoveredId(null);
      }
      return next;
    });
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: 560,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        border: "1px solid #DDE1E4",
        fontFamily: SANS,
        color: "#0E1216",
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          padding: "10px 14px 10px 16px",
          borderBottom: "1px solid #DDE1E4",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: "#0E1216", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.filename}</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            {doc.pageCount} pages · {formatBytes(doc.sizeBytes)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: v.color }}>
            <span aria-hidden="true" style={{ display: "inline-block", width: 12, textAlign: "center", fontWeight: 500 }}>
              {v.glyph}
            </span>
            {verification.verdict}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", letterSpacing: "0.02em" }}>{verification.findings.length} findings</span>
        </div>
      </div>

      {/* Split body */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", flex: 1, minHeight: 0, minWidth: 560, overflowX: "auto" }}>
        {/* Document panel */}
        <div style={{ position: "relative", background: "#EDEFF1", borderRight: "1px solid #DDE1E4", padding: 20, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
          <div style={{ position: "relative", flex: 1, minHeight: 0, background: "#FFFFFF", border: "1px solid #DDE1E4", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {!hasStoredFile && (
              <div style={{ padding: "0 32px", textAlign: "center", fontFamily: SANS, fontSize: 13, color: "#767C83", lineHeight: 1.5 }}>
                No stored file for this document — the original PDF wasn&apos;t kept, so there&apos;s no page image to show. The findings on the right are real.
              </div>
            )}
            {hasStoredFile && pdfStage === "loading" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, background: "#767C83", display: "inline-block" }} />
                <span style={{ fontFamily: MONO, fontSize: 12, color: "#43494F", letterSpacing: "0.12em" }}>LOADING…</span>
              </div>
            )}
            {hasStoredFile && pdfStage === "error" && (
              <div style={{ padding: "0 32px", textAlign: "center", fontFamily: SANS, fontSize: 13, color: "#43494F", lineHeight: 1.5 }}>
                Could not load the stored file.
              </div>
            )}
            {hasStoredFile && pdfStage === "ready" && (
              <>
                <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                {activeFinding?.rect && pageDims && (
                  <AnnotationOverlay
                    rect={activeFinding.rect}
                    color={VERDICT[activeFinding.verdict].color}
                    fill={VERDICT[activeFinding.verdict].fill}
                    viewBoxWidth={pageDims.widthPt}
                    viewBoxHeight={pageDims.heightPt}
                    animationKey={activeFinding.id}
                  />
                )}
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>page</span>
              <span style={{ display: "inline-flex", alignItems: "center", border: "1px solid #DDE1E4", borderRadius: 3, overflow: "hidden" }}>
                <button onClick={() => goToPage(-1)} disabled={page <= 1} style={{ padding: "2px 8px", color: "#43494F", background: "#FFFFFF", opacity: page > 1 ? 1 : 0.4 }}>
                  ‹
                </button>
                <span style={{ padding: "2px 8px", borderLeft: "1px solid #DDE1E4", borderRight: "1px solid #DDE1E4", background: "#FFFFFF", color: "#0E1216" }}>{page}</span>
                <button onClick={() => goToPage(1)} disabled={page >= pageCount} style={{ padding: "2px 8px", color: "#43494F", background: "#FFFFFF", opacity: page < pageCount ? 1 : 0.4 }}>
                  ›
                </button>
              </span>
              <span>of {pageCount}</span>
            </div>
          </div>
        </div>

        {/* Findings panel */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "#FFFFFF" }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center", padding: "10px 16px 10px 0", borderBottom: "1px solid #DDE1E4" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em", textAlign: "center" }}>04</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em" }}>FINDINGS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em" }}>
                <span style={{ color: "#B4231F", fontWeight: 600 }}>{counts.fail} FAIL</span>
                <span style={{ color: "#A66A00", fontWeight: 600 }}>{counts.review} REVIEW</span>
                <span style={{ color: "#767C83" }}>{counts.clear} CLEAR</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {findings.length === 0 && <div style={{ padding: "24px 16px", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>No findings or facts on this page.</div>}
            {findings.map((f) => (
              <FindingRow key={f.id} finding={f} isActive={f.id === activeId} isPinned={f.id === pinnedId} onHover={setHoveredId} onPin={setPinnedId} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
