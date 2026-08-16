import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { VerifyEnvelope } from "@/lib/api/envelope";
import type { SignatureEnvelope } from "@/lib/signing/sign";
import { MARKER_REGISTRY } from "@/lib/verification/registry";

const PAGE = { width: 612, height: 792 };
const MARGIN = 56;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const INK = rgb(0.05, 0.07, 0.09); // #0E1216
const MUTED = rgb(0.46, 0.49, 0.51); // #767C83
const LINE = rgb(0.87, 0.88, 0.89); // #DDE1E4
const FAIL = rgb(0.71, 0.14, 0.12); // #B4231F
const REVIEW = rgb(0.65, 0.42, 0); // #A66A00
const CLEAR = rgb(0.12, 0.42, 0.29); // #1F6B4A
const INCONCLUSIVE = rgb(0.35, 0.4, 0.44); // #5A6570

const VERDICT_COLOR = { CLEAR, REVIEW, FAIL, INCONCLUSIVE } as const;

/**
 * "VERIFIED" only for a real CLEAR — every other verdict means ProofMart
 * either found a problem or couldn't run enough content-bearing checks to
 * vouch for the document, and the dossier must say so plainly rather than
 * softening it. See the DISCLOSURE text below for what "VERIFIED" actually
 * means (structural/arithmetic consistency, not authenticity).
 */
function verifiedBanner(verdict: keyof typeof VERDICT_COLOR): { label: string; color: ReturnType<typeof rgb> } {
  if (verdict === "CLEAR") return { label: "VERIFIED — NO ISSUES FOUND", color: CLEAR };
  return { label: `NOT VERIFIED — ${verdict}`, color: VERDICT_COLOR[verdict] };
}

const DISCLOSURE =
  "ProofMart checks a document's own internal structure and content for inconsistencies detectable by " +
  "computation: arithmetic that doesn't reconcile, dates out of sequence, duplicate transactions, encoding " +
  "irregularities, and extraction confidence. Every check is deterministic and reproducible — no machine " +
  "learning model or human judgment is involved. \"VERIFIED\" above means no such inconsistency was found by " +
  "the markers that ran; it is not a certification that this document is authentic, was issued by the party " +
  "it claims to be from, or wasn't produced by a party aware of what ProofMart checks for. Treat this dossier " +
  "as one input to a review, not as a substitute for verifying the document with its issuer.";

interface DossierInput {
  filename: string;
  envelope: VerifyEnvelope;
  signature: SignatureEnvelope;
}

class Layout {
  doc!: PDFDocument;
  page!: PDFPage;
  font!: PDFFont;
  bold!: PDFFont;
  mono!: PDFFont;
  y = 0;

  static async create(): Promise<Layout> {
    const l = new Layout();
    l.doc = await PDFDocument.create();
    l.doc.setTitle("ProofMart Verification Dossier");
    l.font = await l.doc.embedFont(StandardFonts.Helvetica);
    l.bold = await l.doc.embedFont(StandardFonts.HelveticaBold);
    l.mono = await l.doc.embedFont(StandardFonts.Courier);
    l.newPage();
    return l;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN;
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  /** Wraps `text` to `CONTENT_WIDTH` using real glyph widths for `font`, drawing each line and advancing `y`. */
  wrapped(text: string, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; lineHeight?: number; maxWidth?: number } = {}) {
    const font = opts.font ?? this.font;
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    const lineHeight = opts.lineHeight ?? size * 1.5;
    const maxWidth = opts.maxWidth ?? CONTENT_WIDTH;

    const words = text.split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    for (const l of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(l, { x: MARGIN, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    }
  }

  heading(text: string) {
    this.ensureSpace(30);
    this.y -= 8;
    this.page.drawText(text, { x: MARGIN, y: this.y - 12, size: 13, font: this.bold, color: INK });
    this.y -= 20;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE.width - MARGIN, y: this.y }, thickness: 0.75, color: LINE });
    this.y -= 14;
  }

  /** A label/value row. `value` wraps within the space to the right of the fixed-width label column rather than running off the page edge — the label draws once, aligned with the value's first line. */
  kv(label: string, value: string) {
    const valueX = MARGIN + 150;
    const maxWidth = PAGE.width - MARGIN - valueX;
    const size = 10;
    const lineHeight = size * 1.5;

    const words = value.split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (this.font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);

    this.ensureSpace(lineHeight * lines.length);
    this.page.drawText(label, { x: MARGIN, y: this.y - 9, size: 9, font: this.mono, color: MUTED });
    for (const l of lines) {
      this.page.drawText(l, { x: valueX, y: this.y - size, size, font: this.font, color: INK });
      this.y -= lineHeight;
    }
  }

  spacer(h: number) {
    this.y -= h;
  }
}

/**
 * Renders the exact required contents (branding, verification id, timestamp,
 * document metadata/hash, verdict, findings, marker explanations, page/
 * coordinate references, signature metadata, limitations) into a downloadable
 * PDF via pdf-lib — the same library already used for this repo's own test
 * fixtures, not a new dependency.
 */
export async function generateDossierPdf({ filename, envelope, signature }: DossierInput): Promise<Uint8Array> {
  const l = await Layout.create();
  const { payload } = signature;
  const verdict = payload.verdict;

  // --- Header / branding ---
  l.page.drawRectangle({ x: MARGIN, y: l.y - 14, width: 14, height: 14, color: INK });
  l.page.drawText("ProofMart", { x: MARGIN + 22, y: l.y - 12, size: 15, font: l.bold, color: INK });
  l.page.drawText("Verification dossier", { x: PAGE.width - MARGIN - 130, y: l.y - 11, size: 10, font: l.mono, color: MUTED });
  l.y -= 34;
  l.page.drawLine({ start: { x: MARGIN, y: l.y }, end: { x: PAGE.width - MARGIN, y: l.y }, thickness: 1, color: INK });
  l.y -= 24;

  // --- Verdict banner ---
  const banner = verifiedBanner(verdict);
  l.page.drawText(banner.label, { x: MARGIN, y: l.y - 16, size: 18, font: l.bold, color: banner.color });
  l.y -= 30;
  l.wrapped(`${envelope.findings.length} finding(s) · engine v${payload.engineVersion} · ${payload.timestamp}`, { font: l.mono, size: 9, color: MUTED });
  l.spacer(10);

  // --- Disclosure (always shown, regardless of verdict) ---
  l.wrapped(DISCLOSURE, { size: 9.5, color: MUTED, lineHeight: 14 });

  // --- Document ---
  l.heading("Document");
  l.kv("FILENAME", filename);
  if (envelope.document) {
    l.kv("PAGES", String(envelope.document.pageCount));
    l.kv("SIZE", `${envelope.document.sizeBytes.toLocaleString()} bytes`);
  }
  if (envelope.classification) l.kv("TYPE", envelope.classification.pdfType);
  l.kv("SHA-256", payload.documentHash);

  // --- Verification ---
  l.heading("Verification");
  l.kv("VERIFICATION ID", payload.verificationId);
  l.kv("DOCUMENT ID", payload.documentIdentifier);
  l.kv("VERDICT", verdict);
  l.kv("TIMESTAMP", payload.timestamp);
  l.kv("ENGINE VERSION", payload.engineVersion);
  if (envelope.processing) {
    l.kv("MARKERS RUN", envelope.processing.markersRun.join(", ") || "none");
    if (envelope.processing.markersSkipped.length > 0) {
      l.kv("MARKERS SKIPPED", envelope.processing.markersSkipped.map((m) => m.markerId).join(", "));
    }
  }

  // --- Findings ---
  l.heading(`Findings (${envelope.findings.length})`);
  if (envelope.findings.length === 0) {
    l.wrapped("No findings were raised by any marker that ran against this document.", { size: 10, color: MUTED });
  }
  for (const f of envelope.findings) {
    l.ensureSpace(50);
    const color = VERDICT_COLOR[f.verdict as keyof typeof VERDICT_COLOR] ?? INCONCLUSIVE;
    l.page.drawText(`${f.verdict}`, { x: MARGIN, y: l.y - 10, size: 10, font: l.bold, color });
    l.page.drawText(f.markerId, { x: MARGIN + 60, y: l.y - 10, size: 10, font: l.mono, color: INK });
    l.y -= 16;
    l.wrapped(f.evidence.summary, { size: 10, color: INK });
    if (f.evidence.detail) l.wrapped(f.evidence.detail, { font: l.mono, size: 9, color: MUTED });
    const coords = f.evidence.coordinates.filter((c) => c.rect).map((c) => `p${c.page} @ (${Math.round(c.rect!.x)}, ${Math.round(c.rect!.y)})`);
    if (coords.length > 0) l.wrapped(`Location: ${coords.join("; ")}`, { font: l.mono, size: 9, color: MUTED });
    l.spacer(10);
  }

  // --- Marker explanations (only for markers that actually ran) ---
  if (envelope.processing && envelope.processing.markersRun.length > 0) {
    l.heading("Marker explanations");
    for (const id of envelope.processing.markersRun) {
      const marker = MARKER_REGISTRY.find((m) => m.id === id);
      if (!marker) continue;
      l.ensureSpace(30);
      l.page.drawText(`${marker.id} — ${marker.name}`, { x: MARGIN, y: l.y - 10, size: 10, font: l.bold, color: INK });
      l.y -= 16;
      l.wrapped(marker.description, { size: 9.5, color: INK });
      if (marker.limitations.length > 0) l.wrapped(`Limitations: ${marker.limitations.join(" ")}`, { size: 9, color: MUTED });
      l.spacer(8);
    }
  }

  // --- Signature metadata ---
  l.heading("Signature");
  l.wrapped(
    "This dossier's contents above (verification id, document id, engine version, timestamp, document hash, " +
      "verdict, and findings) are signed as a single canonical payload. Any change to that content invalidates " +
      "the signature below — verify it at proofmart.shop or via POST /v1/verify-signature.",
    { size: 9.5, color: MUTED },
  );
  l.spacer(4);
  l.kv("ALGORITHM", signature.algorithm);
  l.kv("KEY ID", signature.keyId);
  l.wrapped("SIGNATURE (base64)", { font: l.mono, size: 8, color: MUTED });
  l.wrapped(signature.signature, { font: l.mono, size: 8, color: INK, lineHeight: 11 });

  // --- Limitations ---
  l.heading("Limitations");
  l.wrapped(
    "This is not a legal, forensic, or accounting certification. ProofMart's markers detect specific, " +
      "well-defined structural and arithmetic patterns — they do not evaluate whether transactions are " +
      "legitimate, whether amounts are correct in absolute terms, or whether the document's issuer is who it " +
      "claims to be. A CLEAR verdict means the markers that could run found nothing wrong; it does not mean " +
      "every possible form of tampering was checked for. See each marker's own limitations above.",
    { size: 9.5, color: MUTED },
  );

  return l.doc.save();
}
