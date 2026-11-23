"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import AnnotationOverlay from "./annotation-overlay";
import { FindingRow } from "./finding-row";
import SampleDocument from "./sample-document";
import { useLiveDocument } from "./use-live-document";
import { TONE } from "./verdict-tone";
import { SAMPLE_FINDINGS, SAMPLE_PAGE_COUNT, SAMPLE_PAGES, SAMPLE_VIEWBOX, type SampleFinding } from "./sample-statement";
import { railFindingsForPage, verdictCounts, formatBytes } from "@/lib/pdf/rail-adapter";
import type { ProcessingErrorCode, ProcessingStage, RailFinding } from "@/lib/pdf/types";
import { RAIL_STEP_EVENT, RAIL_USER_EVENT, RUN_SAMPLE_EVENT, SCAN_INTENT_EVENT } from "./scan-intent";
import RollPill from "@/components/motion/roll-pill";
import Tickmark, { Arrow, type TickKind } from "@/components/paper/tickmark";

/** sha256 of some bytes, as lowercase hex (Web Crypto; null where unavailable, e.g. an insecure origin). */
async function sha256Hex(data: BufferSource): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

/** The sample has no PDF bytes, so its hash is of the data the page is drawn from: real, reproducible, and labelled as such. */
const SAMPLE_BYTES = () => new TextEncoder().encode(JSON.stringify(SAMPLE_PAGES));

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
const PREVIEW_PAGES = [...new Set(SAMPLE_FINDINGS.map((f) => f.page))];

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [hashCopied, setHashCopied] = useState(false);
  const docPaneRef = useRef<HTMLDivElement>(null);
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

  const live = useLiveDocument(canvasRef, {
    onPageSettled: (firstId) => {
      setPinnedId(firstId);
      setHoveredId(null);
    },
    onReset: () => {
      setPinnedId(SAMPLE_DEFAULT_PIN);
      setSamplePage(4);
      setHoveredId(null);
      sha256Hex(SAMPLE_BYTES()).then(setHash);
    },
  });
  const isLive = live.stage !== "idle";
  const { stage: liveStage, reset: resetLive } = live;

  useEffect(() => {
    sha256Hex(SAMPLE_BYTES()).then(setHash);
  }, []);

  // Every way in (drop, paste, pick) goes through here, so the header's
  // hash is always of the exact bytes the engine is reading.
  const loadFile = (file: File) => {
    setHash(null);
    file.arrayBuffer().then(sha256Hex).then(setHash);
    live.loadFile(file);
  };

  // Paste-to-upload while the rail is mounted (one rail per page).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find(isPdfFile);
      if (file) loadFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onArm = () => {
      setArmed(true);
      // After the CTA's smooth scroll has had time to land; again once a
      // longer (Lenis) scroll has settled, in case the first try was early.
      const focusChoose = () => {
        if (document.activeElement !== chooseRef.current) chooseRef.current?.focus({ preventScroll: true });
      };
      window.setTimeout(focusChoose, 450);
      window.setTimeout(focusChoose, 1300);
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
    const onRun = () => {
      if (liveStage !== "idle") resetLive();
      setArmed(false);
      setPinnedId(SAMPLE_DEFAULT_PIN);
      setSamplePage(SAMPLE_FINDINGS.find((f) => f.id === SAMPLE_DEFAULT_PIN)?.page ?? 4);
      window.setTimeout(() => document.querySelector<HTMLButtonElement>('[data-testid="evidence-rail"] .pm-frow')?.focus({ preventScroll: true }), 450);
    };
    window.addEventListener(RUN_SAMPLE_EVENT, onRun);
    return () => window.removeEventListener(RUN_SAMPLE_EVENT, onRun);
  }, [liveStage, resetLive]);

  // The scroll layer steps through the sample's findings while the rail is
  // pinned (motion/home-scroll.ts). Only on the sample, never over a real
  // upload, and never once the visitor has taken over.
  useEffect(() => {
    const onStep = (e: Event) => {
      if (liveStage !== "idle") return;
      const f = SAMPLE_FINDINGS[(e as CustomEvent<number>).detail];
      if (!f) return;
      setPinnedId(f.id);
      setSamplePage(f.page);
    };
    window.addEventListener(RAIL_STEP_EVENT, onStep);
    return () => window.removeEventListener(RAIL_STEP_EVENT, onStep);
  }, [liveStage]);

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
    if (file) loadFile(file);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const liveFindings = live.document ? railFindingsForPage(live.document, live.verification, live.page) : [];
  const displayFindings: RailFinding[] = isLive ? liveFindings : SAMPLE_FINDINGS;
  const activeFinding = displayFindings.find((f) => f.id === pinnedId) ?? null;
  const sampleActive = !isLive ? (activeFinding as SampleFinding | null) : null;
  // Hover previews a finding's box (dashed, pulsing) without pinning it;
  // the pinned box is drawn solid. A sample finding previews only when it
  // lives on the page already showing.
  const hoverFinding = hoveredId && hoveredId !== pinnedId ? (displayFindings.find((f) => f.id === hoveredId) ?? null) : null;
  const sampleHover = !isLive && hoverFinding && (hoverFinding as SampleFinding).page === samplePage ? (hoverFinding as SampleFinding) : null;

  // Pinning a sample finding turns the sample to the page it lives on, and
  // on a stacked (phone) layout brings that page back into view.
  const pin = (updater: (prev: string | null) => string | null) => {
    const next = updater(pinnedId);
    setPinnedId(next);
    if (!isLive && next) {
      const f = SAMPLE_FINDINGS.find((x) => x.id === next);
      if (f) setSamplePage(f.page);
    }
    const pane = docPaneRef.current;
    if (next && pane && pane.getBoundingClientRect().bottom < 80) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      pane.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  };

  // ↑/↓ move between findings; Enter/Space (native button) pins.
  const onListKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".pm-frow"));
    if (rows.length === 0) return;
    e.preventDefault();
    const at = rows.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? Math.min(rows.length - 1, at + 1) : Math.max(0, at < 0 ? 0 : at - 1);
    rows[next].focus();
  };

  const copyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 1400);
    } catch {
      // Clipboard unavailable: the full hash is in the title attribute to select by hand.
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
      onPointerDown={() => window.dispatchEvent(new Event(RAIL_USER_EVENT))}
      onKeyDown={() => window.dispatchEvent(new Event(RAIL_USER_EVENT))}
      data-testid="evidence-rail"
      className="pm-rail"
      data-drag={dragActive ? "" : undefined}
      data-live={isLive ? "" : undefined}
    >
      <input ref={fileInputRef} id="pm-file-input" type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={handleFilePicked} />

      {/* Top bar: what is loaded, its hash, the verdict. Sticky on a phone. */}
      <div className="pm-rail-bar">
        <div className="pm-rail-file">
          <span className="pm-rail-filename">{headerFilename}</span>
          <span className="pm-rail-meta">{headerMeta}</span>
          <button
            type="button"
            className="pm-rail-hash"
            onClick={copyHash}
            disabled={!hash}
            title={hash ? `Copy the full sha256: ${hash}` : "Computing sha256"}
          >
            <span className="pm-rail-hash-k">sha256</span>
            <span>{hash ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : "········"}</span>
            <span className="pm-rail-hash-act">{hashCopied ? "copied ✓" : "copy"}</span>
          </button>
        </div>
        <div className="pm-rail-tools">
          {/* Keyed on the label so each new verdict lands fresh. */}
          <span key={badgeLabel} className="pm-mk-verdict pm-verdict-in" data-tone={badgeTone}>
            <Tickmark kind={badgeTick} size={14} />
            {badgeLabel}
          </span>
          {isLive ? null : <span className="pm-sample">Sample</span>}
          <button type="button" aria-label="Copy JSON" onClick={handleCopyJson} className="pm-chip">
            {copied ? "Copied ✓" : "Copy JSON"}
          </button>
          <button
            type="button"
            aria-label={isLive ? "Clear document" : "Close"}
            onClick={() => {
              if (isLive) live.reset();
              else setArmed(false);
            }}
            className="pm-iconbtn"
          >
            <Tickmark kind="break" size={14} />
          </button>
        </div>
      </div>

      <div className="pm-rail-panes">
        {/* Document */}
        <div className="pm-rail-docpane" ref={docPaneRef}>
          {/* Inline `cursor` on purpose: tests/e2e/helpers.ts finds the click
              target that opens the file picker by it. */}
          <div
            className="pm-rail-page"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: isLive && live.stage === "ready" ? "default" : "pointer" }}
          >
            {!isLive && (
              <div key={samplePage} className="pm-rail-sheet">
                <SampleDocument page={samplePage} />
                {sampleActive && sampleActive.page === samplePage
                  ? sampleActive.rects.map((r, i) => (
                      <AnnotationOverlay
                        key={`${sampleActive.id}-${i}`}
                        rect={r}
                        color={TONE[sampleActive.verdict].color}
                        fill={TONE[sampleActive.verdict].wash}
                        viewBoxWidth={SAMPLE_VIEWBOX.w}
                        viewBoxHeight={SAMPLE_VIEWBOX.h}
                        animationKey={`${sampleActive.id}-${samplePage}`}
                      />
                    ))
                  : null}
                {sampleHover?.rects.map((r, i) => (
                  <AnnotationOverlay
                    key={`h-${sampleHover.id}-${i}`}
                    rect={r}
                    color={TONE[sampleHover.verdict].color}
                    fill="none"
                    viewBoxWidth={SAMPLE_VIEWBOX.w}
                    viewBoxHeight={SAMPLE_VIEWBOX.h}
                    animationKey={`h-${sampleHover.id}`}
                    preview
                  />
                ))}
              </div>
            )}

            {!isLive && (armed || dragActive) && (
              <div className="pm-dropzone" data-testid="rail-dropzone" onClick={(e) => e.stopPropagation()}>
                <span className="pm-dropzone-title">{dragActive ? "Drop it here" : "Drop a PDF here"}</span>
                <span className="pm-dropzone-sub">or paste one, or</span>
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
                <span className="pm-dropzone-note">Up to 20 MB. Signed-out scans are deleted after processing.</span>
              </div>
            )}

            {isLive && (live.stage === "reading" || live.stage === "inspecting" || live.stage === "extracting") && <ProcessingNotice stage={live.stage} />}

            {isLive && live.stage === "error" && live.error && <ErrorNotice message={live.error.message} />}

            {isLive && live.stage === "ready" && live.document && (
              <>
                <canvas ref={canvasRef} className="pm-rail-canvas" />
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
                {hoverFinding?.rect && live.pageDims && (
                  <AnnotationOverlay
                    rect={hoverFinding.rect}
                    color={TONE[hoverFinding.verdict].color}
                    fill="none"
                    viewBoxWidth={live.pageDims.widthPt}
                    viewBoxHeight={live.pageDims.heightPt}
                    animationKey={`h-${hoverFinding.id}`}
                    preview
                  />
                )}
              </>
            )}
          </div>

          <div className="pm-rail-docfoot">
            <div className="pm-rail-pager">
              <span>page</span>
              <span className="pm-rail-stepper">
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
            <div className="pm-rail-source">
              <span aria-hidden="true" className="pm-rail-source-dot" />
              <span>{isLive ? "UPLOADED · REAL DOCUMENT" : "SAMPLE · synthetic document. Drop, paste, or click to try a real one"}</span>
            </div>
          </div>
        </div>

        {/* Findings, as an index table */}
        <div className="pm-rail-findings">
          <div className="pm-rail-fhead">
            <span className="pm-rail-ftitle">Findings · {findingsCountLabel}</span>
            <div className="pm-rail-counts">
              <span data-tone="FAIL">{counts.fail} FAIL</span>
              <span data-tone="REVIEW">{counts.review} REVIEW</span>
              <span data-tone="CLEAR">{counts.clear} CLEAR</span>
            </div>
          </div>
          <div className="pm-rail-cols" aria-hidden="true">
            <span>No.</span>
            <span>Marker</span>
            <span>Verdict</span>
            <span>Cite</span>
            <span />
          </div>

          <div className="pm-rail-flist" onKeyDown={onListKeyDown}>
            {isLive && live.stage !== "ready" && (
              <div className="pm-rail-empty">{live.stage === "error" ? "No findings. Processing failed." : "Findings will appear once processing completes."}</div>
            )}

            {isLive && live.stage === "ready" && displayFindings.length === 0 && <div className="pm-rail-empty">No findings or facts on this page.</div>}

            {(!isLive || live.stage === "ready") &&
              displayFindings.map((f, i) => (
                <FindingRow key={f.id} n={i + 1} preview={isLive ? undefined : `sample:${(f as SampleFinding).page}`} finding={f} isActive={f.id === pinnedId} isPinned={f.id === pinnedId} onHover={setHoveredId} onPin={pin} />
              ))}
          </div>

          <div className="pm-rail-ffoot">
            <span>↑ ↓ to move · Enter to pin · Esc to clear</span>
            <span>{isLive ? "local · not persisted" : "proofmart.shop/d/req_8fk2"}</span>
          </div>
        </div>
      </div>

      {/* Page thumbnails the cursor preview clones (motion-layer.tsx). */}
      {!isLive && (
        <div hidden>
          {PREVIEW_PAGES.map((p) => (
            <div key={p} data-preview-page={p}>
              <SampleDocument page={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProcessingNotice({ stage }: { stage: ProcessingStage }) {
  return (
    <div className="pm-rail-notice">
      <span aria-hidden="true" className="pm-rail-pulse" />
      <span className="pm-rail-notice-label">{STAGE_LABEL[stage]}…</span>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="pm-rail-notice" data-error="">
      <span className="pm-rail-errmark">
        <Tickmark kind="break" size={16} />
      </span>
      <span className="pm-rail-notice-msg">{message}</span>
    </div>
  );
}
