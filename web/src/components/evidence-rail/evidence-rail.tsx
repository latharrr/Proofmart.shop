"use client";

import { useEffect, useRef, useState } from "react";
import AnnotationOverlay from "./annotation-overlay";
import { useLiveDocument } from "./use-live-document";
import { railFindingsForPage, verdictCounts, formatBytes } from "@/lib/pdf/rail-adapter";
import type { ProcessingErrorCode, ProcessingStage, RailFinding } from "@/lib/pdf/types";
import { FINDINGS, MONO, SANS, TXNS, VERDICT, fmt } from "@/lib/evidence-data";

const mutedOrInk = (v: number | null) => (v ? "#0E1216" : "#C2C7CC");

const STAGE_LABEL: Record<ProcessingStage, string> = {
  idle: "",
  reading: "READING",
  inspecting: "INSPECTING",
  extracting: "EXTRACTING",
  ready: "EXTRACTED",
  error: "ERROR",
};

function errorLabel(code: ProcessingErrorCode): string {
  return code.replace(/-/g, " ").toUpperCase();
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

// The bundled sample's hardcoded verification findings, widened to the
// rail's generic shape — structurally identical to `Finding` plus `origin`,
// so this changes no rendered output, only lets sample and live findings
// share one row renderer.
const SAMPLE_RAIL_FINDINGS: RailFinding[] = FINDINGS.map((f) => ({ ...f, origin: "verification-finding" as const }));

export default function EvidenceRail() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>("f1");
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const live = useLiveDocument(canvasRef, {
    // Mirrors the sample's default-pinned finding: whenever a live document
    // (re)settles on a page, pin its first finding. Fired from the event
    // handler that triggered the change (drop/pick/paste, page nav), never
    // from an effect.
    onPageSettled: (firstId) => {
      setPinnedId(firstId);
      setHoveredId(null);
    },
    onReset: () => {
      setPinnedId("f1");
      setHoveredId(null);
    },
  });
  const isLive = live.stage !== "idle";

  // Paste-to-upload while the rail is mounted — there's only one rail on the page (the hero), so a page-scoped listener is the practical reading of "paste where practical."
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find(isPdfFile);
      if (file) live.loadFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = Array.from(e.dataTransfer.files).find(isPdfFile);
    if (file) live.loadFile(file);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) live.loadFile(file);
    e.target.value = "";
  };

  const liveFindings = live.document ? railFindingsForPage(live.document, live.verification, live.page) : [];
  const displayFindings = isLive ? liveFindings : SAMPLE_RAIL_FINDINGS;
  const activeId = hoveredId || pinnedId;
  const activeFinding = displayFindings.find((f) => f.id === activeId) ?? null;

  const counts = isLive
    ? live.verification
      ? verdictCounts(live.verification)
      : { fail: 0, review: 0, clear: 0 }
    : {
        fail: FINDINGS.filter((f) => f.verdict === "FAIL").length,
        review: FINDINGS.filter((f) => f.verdict === "REVIEW").length,
        clear: FINDINGS.filter((f) => f.verdict === "CLEAR").length,
      };

  const handleCopyJson = async () => {
    const payload = isLive
      ? live.document && live.verification
        ? {
            filename: live.document.filename,
            pdfType: live.document.pdfType,
            confidence: live.document.confidence,
            verdict: live.verification.verdict,
            findings: live.verification.findings,
            markersRun: live.verification.markersRun,
            markersSkipped: live.verification.markersSkipped,
            facts: live.document.facts,
          }
        : { error: live.error }
      : {
          request_id: "req_8fk2",
          verdict: "FAIL",
          findings: FINDINGS.map((f) => ({
            marker: f.marker,
            verdict: f.verdict,
            page: 4,
            box: [f.rect.x, f.rect.y, f.rect.w, f.rect.h],
            explanation: f.explanation,
          })),
        };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to fall back to.
    }
  };

  // ---- Header badge: verdict for sample, stage/error/real-verdict for live ----
  let badgeGlyph = "×";
  let badgeColor = "#B4231F";
  let badgeLabel = "FAIL";
  if (isLive) {
    if (live.stage === "ready" && live.verification) {
      const v = VERDICT[live.verification.verdict];
      badgeGlyph = v.glyph;
      badgeColor = v.color;
      badgeLabel = live.verification.verdict;
    } else if (live.stage === "error") {
      badgeGlyph = "×";
      badgeColor = "#B4231F";
      badgeLabel = live.error ? errorLabel(live.error.code) : "ERROR";
    } else {
      badgeGlyph = "·";
      badgeColor = "#767C83";
      badgeLabel = STAGE_LABEL[live.stage];
    }
  }

  const headerFilename = isLive ? live.fileMeta?.name ?? "" : "hdfc_apr25_statement.pdf";
  const headerMeta = isLive
    ? live.stage === "ready" && live.document
      ? `${live.document.pageCount} pages · ${formatBytes(live.document.sizeBytes)} · ${(live.document.processingTimeMs / 1000).toFixed(1)}s`
      : live.fileMeta
        ? formatBytes(live.fileMeta.size)
        : ""
    : "6 pages · 2.1 MB · 4.8s";

  const findingsCountLabel = isLive ? (live.verification ? `${live.verification.findings.length} findings` : "—") : `${FINDINGS.length} markers`;

  const pageCount = isLive ? Math.max(1, live.document?.pageCount ?? 1) : 6;
  const currentPage = isLive ? live.page : 4;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      data-testid="evidence-rail"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 560,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        border: dragActive ? "1px solid #0E1216" : "1px solid #DDE1E4",
        fontFamily: SANS,
        color: "#0E1216",
        overflow: "hidden",
      }}
    >
      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={handleFilePicked} />

      {/* Rail header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          padding: "10px 14px 10px 16px",
          borderBottom: "1px solid #DDE1E4",
          background: "#FFFFFF",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: "#0E1216", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {headerFilename}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{headerMeta}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: badgeColor,
            }}
          >
            <span aria-hidden="true" style={{ display: "inline-block", width: 12, textAlign: "center", fontWeight: 500 }}>
              {badgeGlyph}
            </span>
            {badgeLabel}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", letterSpacing: "0.02em" }}>{findingsCountLabel}</span>
          <span aria-hidden="true" style={{ width: 1, height: 16, background: "#DDE1E4" }} />
          <button
            aria-label="Copy JSON"
            onClick={handleCopyJson}
            style={{ fontFamily: MONO, fontSize: 11, color: "#43494F", padding: "4px 8px", border: "1px solid #DDE1E4", borderRadius: 3 }}
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
          <button
            aria-label={isLive ? "Clear document" : "Close"}
            onClick={() => live.reset()}
            style={{ fontFamily: MONO, fontSize: 14, color: "#767C83", width: 22, height: 22, display: "grid", placeItems: "center" }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Split body */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", flex: 1, minHeight: 0 }}>
        {/* Document panel */}
        <div
          style={{
            position: "relative",
            background: "#EDEFF1",
            borderRight: "1px solid #DDE1E4",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 0,
          }}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              background: "#FFFFFF",
              border: "1px solid #DDE1E4",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLive && live.stage === "ready" ? "default" : "pointer",
            }}
          >
            {!isLive && <SampleDocument activeFinding={activeFinding} />}

            {isLive && (live.stage === "reading" || live.stage === "inspecting" || live.stage === "extracting") && (
              <ProcessingNotice stage={live.stage} />
            )}

            {isLive && live.stage === "error" && live.error && <ErrorNotice message={live.error.message} />}

            {isLive && live.stage === "ready" && live.document && (
              <>
                <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                {activeFinding?.rect && live.pageDims && (
                  <AnnotationOverlay
                    rect={activeFinding.rect}
                    color={VERDICT[activeFinding.verdict].color}
                    fill={VERDICT[activeFinding.verdict].fill}
                    viewBoxWidth={live.pageDims.widthPt}
                    viewBoxHeight={live.pageDims.heightPt}
                    animationKey={activeFinding.id}
                  />
                )}
              </>
            )}
          </div>

          {/* Page toolbar row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>page</span>
              <span style={{ display: "inline-flex", alignItems: "center", border: "1px solid #DDE1E4", borderRadius: 3, overflow: "hidden" }}>
                <button
                  onClick={() => isLive && live.goToPage(-1)}
                  disabled={isLive ? currentPage <= 1 : true}
                  style={{ padding: "2px 8px", color: "#43494F", background: "#FFFFFF", opacity: isLive && currentPage > 1 ? 1 : 0.4 }}
                >
                  ‹
                </button>
                <span style={{ padding: "2px 8px", borderLeft: "1px solid #DDE1E4", borderRight: "1px solid #DDE1E4", background: "#FFFFFF", color: "#0E1216" }}>
                  {currentPage}
                </span>
                <button
                  onClick={() => isLive && live.goToPage(1)}
                  disabled={isLive ? currentPage >= pageCount : true}
                  style={{ padding: "2px 8px", color: "#43494F", background: "#FFFFFF", opacity: isLive && currentPage < pageCount ? 1 : 0.4 }}
                >
                  ›
                </button>
              </span>
              <span>of {pageCount}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, background: isLive ? "#1F6B4A" : "#B4231F", display: "inline-block" }} />
              <span style={{ letterSpacing: "0.02em" }}>
                {isLive ? "UPLOADED · REAL DOCUMENT" : "SAMPLE · synthetic document — drop, paste, or click to try a real one"}
              </span>
            </div>
          </div>
        </div>

        {/* Findings panel */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "#FFFFFF" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              alignItems: "center",
              padding: "10px 16px 10px 0",
              borderBottom: "1px solid #DDE1E4",
              background: "#FFFFFF",
            }}
          >
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
            {isLive && live.stage !== "ready" && (
              <div style={{ padding: "24px 16px", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>
                {live.stage === "error" ? "No findings — processing failed." : "Findings will appear once processing completes."}
              </div>
            )}

            {isLive && live.stage === "ready" && displayFindings.length === 0 && (
              <div style={{ padding: "24px 16px", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>No findings or facts on this page.</div>
            )}

            {(!isLive || live.stage === "ready") &&
              displayFindings.map((f) => (
                <FindingRow key={f.id} finding={f} isActive={f.id === activeId} isPinned={f.id === pinnedId} onHover={setHoveredId} onPin={setPinnedId} />
              ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              alignItems: "center",
              padding: "10px 16px 10px 0",
              borderTop: "1px solid #DDE1E4",
              background: "#FFFFFF",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 10, color: "#767C83", letterSpacing: "0.12em", textAlign: "center" }}>↵</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: "#767C83" }}>
              <span>Tab · Enter to pin · Esc to clear</span>
              <span>{isLive ? "local · not persisted" : "colophon.dev/d/req_8fk2"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One row in the findings panel — shared by the sample's hardcoded
 * verification findings and a live document's real findings/facts. An
 * extracted fact always carries `verdict: "INCONCLUSIVE"` and no
 * arithmetic, so it renders with the same neutral gray "EXTRACTED" badge
 * Phase 1 established; a real verification finding renders with its own
 * FAIL/REVIEW/CLEAR/INCONCLUSIVE color and, when present, the same
 * arithmetic evidence block the sample's findings use.
 */
function FindingRow({
  finding,
  isActive,
  isPinned,
  onHover,
  onPin,
}: {
  finding: RailFinding;
  isActive: boolean;
  isPinned: boolean;
  onHover: (id: string | null) => void;
  onPin: (updater: (prev: string | null) => string | null) => void;
}) {
  const v = VERDICT[finding.verdict];
  const addrId = `addr-${finding.id}`;
  const verdictLabel = finding.origin === "extracted-fact" ? "EXTRACTED" : finding.verdict;

  return (
    <button
      aria-describedby={addrId}
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(finding.id)}
      onBlur={() => onHover(null)}
      onClick={() => onPin((prev) => (prev === finding.id ? null : finding.id))}
      style={{
        display: "block",
        width: "100%",
        background: isActive ? v.fill : "transparent",
        borderLeft: isPinned ? `2px solid ${v.color}` : "2px solid transparent",
        transition: "background-color 120ms cubic-bezier(0.2,0,0,1)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 0, padding: "14px 0", borderBottom: "1px solid #DDE1E4", width: "100%", alignItems: "start" }}>
        <div id={addrId} style={{ fontFamily: MONO, fontSize: 11, color: "#767C83", textAlign: "center", lineHeight: "16px" }}>
          <div>{finding.addr1}</div>
          <div style={{ marginTop: 2 }}>{finding.addr2}</div>
        </div>
        <div style={{ paddingRight: 16, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: "#0E1216", letterSpacing: "0.02em" }}>{finding.marker}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: v.color,
                whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden="true" style={{ display: "inline-block", width: 12, textAlign: "center", fontWeight: 500 }}>
                {v.glyph}
              </span>
              {verdictLabel}
            </span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: "20px", color: "#43494F", marginTop: 6 }}>{finding.explanation}</div>
          {finding.arithmetic && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 10px",
                background: "#EDEFF1",
                borderLeft: `2px solid ${v.color}`,
                fontFamily: MONO,
                fontSize: 12,
                lineHeight: "18px",
                color: "#0E1216",
                whiteSpace: "pre-line",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {finding.arithmetic}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ProcessingNotice({ stage }: { stage: ProcessingStage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, background: "#767C83", display: "inline-block" }} />
      <span style={{ fontFamily: MONO, fontSize: 12, color: "#43494F", letterSpacing: "0.12em" }}>{STAGE_LABEL[stage]}…</span>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0 32px", textAlign: "center" }}>
      <span
        aria-hidden="true"
        style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid #B4231F", display: "grid", placeItems: "center", color: "#B4231F", fontFamily: MONO, fontSize: 13 }}
      >
        ×
      </span>
      <span style={{ fontFamily: SANS, fontSize: 13, color: "#43494F", lineHeight: 1.5 }}>{message}</span>
    </div>
  );
}

function SampleDocument({ activeFinding }: { activeFinding: RailFinding | null }) {
  return (
    <>
      <svg viewBox="0 0 640 800" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
        <text x={32} y={30} fontFamily={MONO} fontSize={10} fontWeight={500} fill="#767C83" letterSpacing={1.2}>
          PAGE 04 · APR 2025
        </text>
        <text x={608} y={30} fontFamily={MONO} fontSize={10} fill="#767C83" textAnchor="end">
          continued from p3
        </text>

        <g transform="translate(32, 54)">
          <rect x={0} y={0} width={14} height={14} fill="#0E1216" />
          <text x={24} y={12} fontFamily={SANS} fontSize={16} fontWeight={600} fill="#0E1216" letterSpacing="0.02em">
            HDFC BANK
          </text>
          <text x={120} y={12} fontFamily={SANS} fontSize={12} fill="#767C83">
            Statement of Account
          </text>
        </g>

        <g transform="translate(32, 100)">
          <text x={0} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            ACCOUNT
          </text>
          <text x={0} y={18} fontFamily={MONO} fontSize={14} fill="#0E1216">
            XXXX-XX-4821
          </text>

          <text x={200} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            HOLDER
          </text>
          <text x={200} y={18} fontFamily={SANS} fontSize={14} fill="#0E1216">
            Rajesh Sharma
          </text>

          <text x={0} y={46} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            PERIOD
          </text>
          <text x={0} y={64} fontFamily={MONO} fontSize={14} fill="#0E1216">
            01 Apr 2025 – 30 Apr 2025
          </text>

          <text x={304} y={46} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            PRODUCER
          </text>
          <text x={304} y={64} fontFamily={MONO} fontSize={14} fill="#0E1216">
            Microsoft Word 2016
          </text>
        </g>

        <line x1={32} y1={196} x2={608} y2={196} stroke="#DDE1E4" strokeWidth={1} />

        <g transform="translate(0, 218)">
          <text x={32} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            #
          </text>
          <text x={60} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            DATE
          </text>
          <text x={120} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            DESCRIPTION
          </text>
          <text x={430} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2} textAnchor="end">
            DEBIT
          </text>
          <text x={520} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2} textAnchor="end">
            CREDIT
          </text>
          <text x={612} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2} textAnchor="end">
            BALANCE
          </text>
        </g>
        <line x1={32} y1={228} x2={608} y2={228} stroke="#C2C7CC" strokeWidth={1.25} />

        {TXNS.map((t, idx) => {
          const y = 240 + idx * 26;
          const balColor = t.breakBalance ? "#B4231F" : "#0E1216";
          const balWeight = t.breakBalance ? 600 : 400;
          return (
            <g key={t.i} transform={`translate(0, ${y})`}>
              <text x={52} y={16} fontFamily={MONO} fontSize={12} fill="#767C83" textAnchor="end">
                {String(t.i).padStart(2, "0")}
              </text>
              <text x={60} y={16} fontFamily={MONO} fontSize={12} fill="#0E1216">
                {t.date}
              </text>
              <text x={120} y={16} fontFamily={SANS} fontSize={12} fill="#0E1216">
                {t.desc}
              </text>
              <text x={430} y={16} fontFamily={MONO} fontSize={12} fill={mutedOrInk(t.debit)} textAnchor="end">
                {fmt(t.debit)}
              </text>
              <text x={520} y={16} fontFamily={MONO} fontSize={12} fill={mutedOrInk(t.credit)} textAnchor="end">
                {fmt(t.credit)}
              </text>
              <text x={612} y={16} fontFamily={MONO} fontSize={12} fill={balColor} fontWeight={balWeight} textAnchor="end">
                {fmt(t.balance)}
              </text>
              <line x1={32} y1={26} x2={608} y2={26} stroke="#EDEFF1" strokeWidth={1} />
            </g>
          );
        })}

        <g transform="translate(0, 570)">
          <text x={32} y={0} fontFamily={MONO} fontSize={10} fill="#767C83" letterSpacing={1.2}>
            CARRIED TO P5
          </text>
          <text x={612} y={0} fontFamily={MONO} fontSize={12} fill="#0E1216" fontWeight={500} textAnchor="end">
            91,710.00
          </text>
        </g>
        <line x1={32} y1={580} x2={608} y2={580} stroke="#DDE1E4" strokeWidth={1} />

        <text x={32} y={612} fontFamily={MONO} fontSize={9} fill="#767C83" letterSpacing={1.2}>
          HDFC BANK LIMITED · REGD. OFFICE HDFC HOUSE, MUMBAI
        </text>
        <text x={32} y={626} fontFamily={MONO} fontSize={9} fill="#767C83" letterSpacing={1.2}>
          CIN L65920MH1994PLC080618 · WWW.HDFCBANK.COM
        </text>
        <text x={608} y={640} fontFamily={MONO} fontSize={9} fill="#767C83" letterSpacing={1.2} textAnchor="end">
          PAGE 4 / 6
        </text>
      </svg>

      {activeFinding?.rect && (
        <AnnotationOverlay
          rect={activeFinding.rect}
          color={VERDICT[activeFinding.verdict].color}
          fill={VERDICT[activeFinding.verdict].fill}
          viewBoxWidth={640}
          viewBoxHeight={800}
          animationKey={activeFinding.id}
        />
      )}
    </>
  );
}
