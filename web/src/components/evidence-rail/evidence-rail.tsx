"use client";

import { useEffect, useRef, useState } from "react";
import AnnotationOverlay from "./annotation-overlay";
import { FindingRow } from "./finding-row";
import { useLiveDocument } from "./use-live-document";
import { TONE } from "./verdict-tone";
import { SAMPLE_FINDINGS, SAMPLE_PAGE_COUNT, SAMPLE_PAGES, SAMPLE_VIEWBOX, ROW_H, ROW_TOP, type SampleFinding } from "./sample-statement";
import { railFindingsForPage, verdictCounts, formatBytes } from "@/lib/pdf/rail-adapter";
import type { ProcessingErrorCode, ProcessingStage, RailFinding } from "@/lib/pdf/types";
import { fmt } from "@/lib/evidence-data";
import { SCAN_INTENT_EVENT } from "./scan-intent";
import RollPill from "@/components/motion/roll-pill";
import Tickmark, { Arrow, type TickKind } from "@/components/paper/tickmark";
import { usePageTurn } from "@/components/paper/use-page-turn";

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

const SAMPLE_DEFAULT_PIN = "f1";

/**
 * The Evidence Rail: the bundled sample scan, and the real upload. Drop,
 * paste or pick a PDF and the same panel runs the real pipeline on it.
 *
 * Sample findings know their page: pinning one turns the sample to that page
 * and boxes the rows it names (sample-statement.ts holds the geometry). The
 * box follows the pinned finding only — hover gives a neutral fill, never a
 * verdict-coloured preview.
 */
export default function EvidenceRail() {
  const [, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(SAMPLE_DEFAULT_PIN);
  const [samplePage, setSamplePage] = useState(4);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  // Set by a "Start a scan" CTA (see open-scan-button.tsx): the drop zone
  // shows itself and its button takes focus, so the CTA visibly starts
  // something without springing the OS file dialog on the visitor.
  const [armed, setArmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);

  const live = useLiveDocument(canvasRef, {
    onPageSettled: (firstId) => {
      setPinnedId(firstId);
      setHoveredId(null);
    },
    onReset: () => {
      setPinnedId(SAMPLE_DEFAULT_PIN);
      setSamplePage(4);
      setHoveredId(null);
    },
  });
  const isLive = live.stage !== "idle";

  // Paste-to-upload while the rail is mounted (one rail per page).
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
    const onArm = () => {
      setArmed(true);
      // After the CTA's smooth scroll has had time to land.
      window.setTimeout(() => chooseRef.current?.focus({ preventScroll: true }), 450);
    };
    window.addEventListener(SCAN_INTENT_EVENT, onArm);
    // Arriving via SCAN_URL: arm once, then drop the param so a reload doesn't re-arm.
    const url = new URL(window.location.href);
    if (url.searchParams.has("scan")) {
      onArm();
      url.searchParams.delete("scan");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    return () => window.removeEventListener(SCAN_INTENT_EVENT, onArm);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinnedId(null);
        setHoveredId(null);
        setArmed(false);
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
  const displayFindings: RailFinding[] = isLive ? liveFindings : SAMPLE_FINDINGS;
  const activeFinding = displayFindings.find((f) => f.id === pinnedId) ?? null;
  const sampleActive = !isLive ? (activeFinding as SampleFinding | null) : null;

  // Pinning a sample finding turns the sample to the page it lives on.
  const pin = (updater: (prev: string | null) => string | null) => {
    const next = updater(pinnedId);
    setPinnedId(next);
    if (!isLive && next) {
      const f = SAMPLE_FINDINGS.find((x) => x.id === next);
      if (f) setSamplePage(f.page);
    }
  };

  const counts = isLive
    ? live.verification
      ? verdictCounts(live.verification)
      : { fail: 0, review: 0, clear: 0 }
    : {
        fail: SAMPLE_FINDINGS.filter((f) => f.verdict === "FAIL").length,
        review: SAMPLE_FINDINGS.filter((f) => f.verdict === "REVIEW").length,
        clear: SAMPLE_FINDINGS.filter((f) => f.verdict === "CLEAR").length,
      };

  const handleCopyJson = async () => {
    const payload = isLive
      ? live.document && live.verification
        ? {
            filename: live.document.filename,
            pdfType: live.document.pdfType,
            confidence: live.document.confidence,
            documentKind: live.verification.documentKind,
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
          findings: SAMPLE_FINDINGS.map((f) => ({
            marker: f.marker,
            verdict: f.verdict,
            page: f.page,
            boxes: f.rects.map((r) => [r.x, r.y, r.w, r.h]),
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
  let badgeTick: TickKind = TONE.FAIL.tick;
  let badgeTone = "FAIL";
  let badgeLabel = "FAIL";
  if (isLive) {
    if (live.stage === "ready" && live.verification) {
      badgeTick = TONE[live.verification.verdict].tick;
      badgeTone = live.verification.verdict;
      badgeLabel = live.verification.verdict;
    } else if (live.stage === "error") {
      badgeTick = "break";
      badgeTone = "FAIL";
      badgeLabel = live.error ? errorLabel(live.error.code) : "ERROR";
    } else {
      badgeTick = "none";
      badgeTone = "PENDING";
      badgeLabel = STAGE_LABEL[live.stage];
    }
  }

  const headerFilename = isLive ? live.fileMeta?.name ?? "" : "meridian_apr25_statement.pdf";
  const headerMeta = isLive
    ? live.stage === "ready" && live.document
      ? `${live.document.pageCount} pages · ${formatBytes(live.document.sizeBytes)} · ${(live.document.processingTimeMs / 1000).toFixed(1)}s`
      : live.fileMeta
        ? formatBytes(live.fileMeta.size)
        : ""
    : "6 pages · 2.1 MB · 4.8s";

  const findingsCountLabel = isLive ? (live.verification ? `${live.verification.findings.length} findings` : "·") : `${SAMPLE_FINDINGS.length} findings`;

  const pageCount = isLive ? Math.max(1, live.document?.pageCount ?? 1) : SAMPLE_PAGE_COUNT;
  const currentPage = isLive ? live.page : samplePage;
  usePageTurn(leafRef, currentPage);

  const goPage = (delta: number) => {
    if (isLive) live.goToPage(delta);
    else setSamplePage((p) => Math.min(SAMPLE_PAGE_COUNT, Math.max(1, p + delta)));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      data-testid="evidence-rail"
      className="pm-mk-rail"
      data-drag={dragActive ? "" : undefined}
      data-live={isLive ? "" : undefined}
    >
      <input ref={fileInputRef} id="pm-file-input" type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={handleFilePicked} />

      {/* Rail header */}
      <div className="pm-mk-rail-head">
        <div className="pm-mk-rail-file">
          <span className="pm-mk-rail-fileicon" aria-hidden="true" />
          <span className="pm-mk-rail-filename">{headerFilename}</span>
          <span className="pm-mk-rail-meta">{headerMeta}</span>
        </div>
        <div className="pm-mk-rail-tools">
          {/* Keyed on the label so each new verdict lands as a fresh stamp. */}
          <span key={badgeLabel} className="pm-mk-verdict pm-stamp-in" data-tone={badgeTone}>
            <Tickmark kind={badgeTick} size={14} />
            {badgeLabel}
          </span>
          <span className="pm-mk-rail-count">{findingsCountLabel}</span>
          <button type="button" aria-label="Copy JSON" onClick={handleCopyJson} className="pm-mk-chip">
            {copied ? (
              <>
                <Tickmark kind="agreed" size={13} className="pm-draw" />
                Copied
              </>
            ) : (
              "Copy JSON"
            )}
          </button>
          <button
            type="button"
            aria-label={isLive ? "Clear document" : "Close"}
            onClick={() => {
              if (isLive) live.reset();
              else setArmed(false);
            }}
            className="pm-mk-iconbtn"
          >
            <Tickmark kind="break" size={14} />
          </button>
        </div>
      </div>

      <div className="pm-mk-rail-panes">
        {/* Document panel */}
        <div className="pm-mk-rail-docpane">
          {/* Inline `cursor` on purpose: tests/e2e/helpers.ts finds the click
              target that opens the file picker by it. */}
          <div
            className="pm-mk-rail-page"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: isLive && live.stage === "ready" ? "default" : "pointer" }}
          >
            <div ref={leafRef} className="pm-leaf" aria-hidden="true" />
            {!isLive && <SampleDocument page={samplePage} active={sampleActive && sampleActive.page === samplePage ? sampleActive : null} />}

            {!isLive && (armed || dragActive) && (
              <div className="pm-mk-dropzone" data-testid="rail-dropzone" onClick={(e) => e.stopPropagation()}>
                <span className="pm-mk-dropzone-title">{dragActive ? "Drop it here" : "Drop a PDF here"}</span>
                <span className="pm-mk-dropzone-sub">or paste one, or</span>
                <RollPill
                  ref={chooseRef}
                  dot
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose a PDF
                </RollPill>
                <span className="pm-mk-dropzone-note">Up to 20 MB. Signed-out scans are deleted after processing.</span>
              </div>
            )}

            {isLive && (live.stage === "reading" || live.stage === "inspecting" || live.stage === "extracting") && <ProcessingNotice stage={live.stage} />}

            {isLive && live.stage === "error" && live.error && <ErrorNotice message={live.error.message} />}

            {isLive && live.stage === "ready" && live.document && (
              <>
                <canvas ref={canvasRef} className="pm-mk-rail-canvas" />
                {activeFinding?.rect && live.pageDims && (
                  <AnnotationOverlay
                    rect={activeFinding.rect}
                    color={TONE[activeFinding.verdict].color}
                    fill={TONE[activeFinding.verdict].wash}
                    viewBoxWidth={live.pageDims.widthPt}
                    viewBoxHeight={live.pageDims.heightPt}
                    animationKey={activeFinding.id}
                  />
                )}
              </>
            )}
          </div>

          {/* Page toolbar row */}
          <div className="pm-mk-rail-docfoot">
            <div className="pm-mk-rail-pager">
              <span>page</span>
              <span className="pm-mk-rail-stepper">
                <button type="button" aria-label="Previous page" onClick={() => goPage(-1)} disabled={currentPage <= 1}>
                  <Arrow dir="left" />
                </button>
                <span>{currentPage}</span>
                <button type="button" aria-label="Next page" onClick={() => goPage(1)} disabled={currentPage >= pageCount}>
                  <Arrow />
                </button>
              </span>
              <span>of {pageCount}</span>
            </div>
            <div className="pm-mk-rail-source">
              <span aria-hidden="true" className="pm-mk-rail-source-dot" />
              <span>{isLive ? "UPLOADED · REAL DOCUMENT" : "SAMPLE · synthetic document. Drop, paste, or click to try a real one"}</span>
            </div>
          </div>
        </div>

        {/* Findings panel */}
        <div className="pm-mk-rail-findings">
          <div className="pm-mk-rail-fhead">
            <span>FINDINGS</span>
            <div className="pm-mk-rail-counts">
              <span data-tone="FAIL">{counts.fail} FAIL</span>
              <span data-tone="REVIEW">{counts.review} REVIEW</span>
              <span data-tone="CLEAR">{counts.clear} CLEAR</span>
            </div>
          </div>

          <div className="pm-mk-rail-flist">
            {isLive && live.stage !== "ready" && (
              <div className="pm-mk-rail-empty">{live.stage === "error" ? "No findings. Processing failed." : "Findings will appear once processing completes."}</div>
            )}

            {isLive && live.stage === "ready" && displayFindings.length === 0 && <div className="pm-mk-rail-empty">No findings or facts on this page.</div>}

            {(!isLive || live.stage === "ready") &&
              displayFindings.map((f) => (
                <FindingRow key={f.id} finding={f} isActive={f.id === pinnedId} isPinned={f.id === pinnedId} onHover={setHoveredId} onPin={pin} />
              ))}
          </div>

          <div className="pm-mk-rail-ffoot">
            <span>Click or Enter to pin · Esc to clear</span>
            <span>{isLive ? "local · not persisted" : "proofmart.shop/d/req_8fk2"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingNotice({ stage }: { stage: ProcessingStage }) {
  return (
    <div className="pm-mk-rail-notice">
      <span aria-hidden="true" className="pm-mk-rail-pulse" />
      <span className="pm-mk-rail-notice-label">{STAGE_LABEL[stage]}…</span>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="pm-mk-rail-notice" data-error="">
      <span className="pm-mk-rail-errmark">
        <Tickmark kind="break" size={16} />
      </span>
      <span className="pm-mk-rail-notice-msg">{message}</span>
    </div>
  );
}

const MONO = "var(--font-mono), ui-monospace, monospace";
const SANS = "var(--font-sans), system-ui, sans-serif";
// The bank's PDF is a white printout lying on the green working paper, so it
// keeps a printer's neutral greys rather than the pad's palette.
const INK = "#1d1f22";
const MUTE = "#666a6e";
const LINE = "#dcddd8";

function SampleDocument({ page, active }: { page: number; active: SampleFinding | null }) {
  const data = SAMPLE_PAGES[page - 1];
  const tableEnd = ROW_TOP + data.rows.length * ROW_H;
  return (
    <>
      <svg
        viewBox={`0 0 ${SAMPLE_VIEWBOX.w} ${SAMPLE_VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="pm-mk-rail-sample"
        aria-label={`Sample statement, page ${page} of ${SAMPLE_PAGE_COUNT}`}
        role="img"
      >
        <text x={32} y={34} fontFamily={MONO} fontSize={11} fill={MUTE} letterSpacing={1.2}>
          PAGE {String(page).padStart(2, "0")} · {data.period}
        </text>
        <text x={608} y={34} fontFamily={MONO} fontSize={11} fill={MUTE} textAnchor="end">
          {page > 1 ? `continued from p${page - 1}` : "statement of account"}
        </text>

        <g transform="translate(32, 62)">
          <rect x={0} y={-2} width={18} height={18} rx={5} fill={INK} />
          <text x={28} y={13} fontFamily={SANS} fontSize={18} fill={INK} letterSpacing="-0.01em">
            MERIDIAN TRUST BANK
          </text>
          <text x={252} y={13} fontFamily={SANS} fontSize={13} fill={MUTE}>
            Statement of Account
          </text>
        </g>

        <g transform="translate(32, 112)">
          <text x={0} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2}>
            ACCOUNT
          </text>
          <text x={0} y={20} fontFamily={MONO} fontSize={14} fill={INK}>
            XXXX-XX-4821
          </text>
          <text x={200} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2}>
            HOLDER
          </text>
          <text x={200} y={20} fontFamily={SANS} fontSize={15} fill={INK}>
            Rajesh Sharma
          </text>
          <text x={392} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2}>
            PRODUCER
          </text>
          <text x={392} y={20} fontFamily={MONO} fontSize={14} fill={INK}>
            Microsoft Word 2016
          </text>
        </g>

        <line x1={32} y1={160} x2={608} y2={160} stroke={LINE} strokeWidth={1} />

        <g transform="translate(0, 218)">
          {[
            { x: 46, t: "#", a: "end" as const },
            { x: 56, t: "DATE" },
            { x: 116, t: "DESCRIPTION" },
            { x: 424, t: "DEBIT", a: "end" as const },
            { x: 518, t: "CREDIT", a: "end" as const },
            { x: 612, t: "BALANCE", a: "end" as const },
          ].map((h) => (
            <text key={h.t} x={h.x} y={0} fontFamily={MONO} fontSize={10} fill={MUTE} letterSpacing={1.2} textAnchor={h.a}>
              {h.t}
            </text>
          ))}
        </g>
        <line x1={28} y1={229} x2={616} y2={229} stroke="#b9bbb5" strokeWidth={1.25} />

        {data.rows.map((t) => {
          const y = ROW_TOP + (t.n - 1) * ROW_H;
          const muted = t.debit === null && t.credit === null;
          return (
            <g key={t.n} transform={`translate(0, ${y})`}>
              <text x={46} y={17} fontFamily={MONO} fontSize={12} fill={MUTE} textAnchor="end">
                {String(t.n).padStart(2, "0")}
              </text>
              <text x={56} y={17} fontFamily={MONO} fontSize={12.5} fill={INK}>
                {t.date}
              </text>
              <text x={116} y={17} fontFamily={SANS} fontSize={13.5} fill={muted ? MUTE : INK}>
                {t.desc}
              </text>
              <text x={424} y={17} fontFamily={MONO} fontSize={12.5} fill={t.debit ? INK : "#b9bbb5"} textAnchor="end">
                {fmt(t.debit)}
              </text>
              <text x={518} y={17} fontFamily={MONO} fontSize={12.5} fill={t.credit !== null ? INK : "#b9bbb5"} textAnchor="end">
                {fmt(t.credit)}
              </text>
              <text x={612} y={17} fontFamily={MONO} fontSize={12.5} fill={INK} textAnchor="end">
                {fmt(t.balance)}
              </text>
              <line x1={28} y1={ROW_H} x2={616} y2={ROW_H} stroke="#ecece8" strokeWidth={1} />
            </g>
          );
        })}

        <g transform={`translate(0, ${tableEnd + 30})`}>
          <text x={32} y={0} fontFamily={MONO} fontSize={11} fill={MUTE} letterSpacing={1.2}>
            {data.carried.label}
          </text>
          <text x={612} y={0} fontFamily={MONO} fontSize={13} fill={INK} textAnchor="end">
            {fmt(data.carried.amount)}
          </text>
        </g>
        <line x1={32} y1={tableEnd + 42} x2={608} y2={tableEnd + 42} stroke={LINE} strokeWidth={1} />

        <text x={32} y={752} fontFamily={MONO} fontSize={9} fill={MUTE} letterSpacing={1.2}>
          MERIDIAN TRUST BANK LIMITED · REGD. OFFICE MERIDIAN HOUSE, MUMBAI
        </text>
        <text x={32} y={766} fontFamily={MONO} fontSize={9} fill={MUTE} letterSpacing={1.2}>
          CIN U65999MH2020PLC000000 · SAMPLE FOR DEMONSTRATION
        </text>
        <text x={608} y={766} fontFamily={MONO} fontSize={9} fill={MUTE} letterSpacing={1.2} textAnchor="end">
          PAGE {page} / {SAMPLE_PAGE_COUNT}
        </text>
      </svg>

      {active?.rects.map((r, i) => (
        <AnnotationOverlay
          key={`${active.id}-${i}`}
          rect={r}
          color={TONE[active.verdict].color}
          fill={TONE[active.verdict].wash}
          viewBoxWidth={SAMPLE_VIEWBOX.w}
          viewBoxHeight={SAMPLE_VIEWBOX.h}
          animationKey={`${active.id}-${page}`}
        />
      ))}
    </>
  );
}
