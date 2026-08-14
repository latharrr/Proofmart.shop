/**
 * Generates PDF fixtures in memory with pdf-lib — no binary assets committed
 * to the repo. Each function returns a fresh Buffer.
 */
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from "pdf-lib";
import { makeSolidPng } from "./png";

const PAGE = { width: 612, height: 792 }; // US Letter

export async function nativeTextPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle("Native Text Fixture");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE.width, PAGE.height]);

  page.drawText("Quarterly Report", { x: 72, y: 720, size: 24, font: bold });
  page.drawText("Prepared for the native-text classification fixture.", { x: 72, y: 690, size: 12, font });
  page.drawText("This paragraph exists purely so pdf-inspector has a real text layer to classify as TextBased.", {
    x: 72,
    y: 660,
    size: 11,
    font,
  });
  page.drawText("https://example.com/report", { x: 72, y: 630, size: 11, font, color: rgb(0.1, 0.2, 0.6) });

  // A real /Link annotation — not just text that looks like a URL — so the
  // pipeline has a genuine, positioned "link" fact to extract, the way a
  // real-world PDF (an invoice, a statement) would carry one.
  const linkAnnot = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [72, 625, 220, 642],
    Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of("https://example.com/report") },
  });
  page.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(linkAnnot)]));

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function multiPagePdf(pageCount = 5): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([PAGE.width, PAGE.height]);
    page.drawText(`Page ${i} of ${pageCount}`, { x: 72, y: 720, size: 20, font: bold });
    page.drawText(`Body text unique to page ${i}.`, { x: 72, y: 690, size: 12, font });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function tableHeavyPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE.width, PAGE.height]);
  page.drawText("Ledger", { x: 72, y: 740, size: 18, font: bold });

  const originX = 72;
  const originY = 700;
  const cols = 4;
  const rows = 8;
  const colWidth = 110;
  const rowHeight = 22;
  const tableWidth = cols * colWidth;
  const tableHeight = rows * rowHeight;

  // Ruled-line grid — the deterministic table signal pdf-inspector's
  // vector-grid detector looks for.
  for (let r = 0; r <= rows; r++) {
    const y = originY - r * rowHeight;
    page.drawLine({ start: { x: originX, y }, end: { x: originX + tableWidth, y }, thickness: 1, color: rgb(0, 0, 0) });
  }
  for (let c = 0; c <= cols; c++) {
    const x = originX + c * colWidth;
    page.drawLine({ start: { x, y: originY }, end: { x, y: originY - tableHeight }, thickness: 1, color: rgb(0, 0, 0) });
  }

  const headers = ["Date", "Description", "Debit", "Credit"];
  for (let c = 0; c < cols; c++) {
    page.drawText(headers[c], { x: originX + c * colWidth + 6, y: originY - 15, size: 10, font: bold });
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      page.drawText(`R${r}C${c}`, { x: originX + c * colWidth + 6, y: originY - r * rowHeight - 15, size: 9, font });
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function scannedPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  // A uniform mid-gray page-sized raster with no text layer at all — the
  // shape a scanner/photocopier produces, which is what should drive a
  // Scanned/ImageBased/Mixed classification instead of TextBased.
  const png = makeSolidPng(850, 1100, [200, 200, 200]);
  const image = await doc.embedPng(png);
  const page = doc.addPage([PAGE.width, PAGE.height]);
  page.drawImage(image, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export function malformedPdfBytes(): Buffer {
  // Has the %PDF- magic so it passes the cheap header check, but the rest
  // is garbage — every native parser downstream should reject it.
  return Buffer.from("%PDF-1.7\n%\xe2\xe3\xcf\xd3\nthis is not a real PDF body, just noise to trip the parser.\n%%EOF", "latin1");
}

export function emptyBytes(): Buffer {
  return Buffer.alloc(0);
}

export function nonPdfBytes(): Buffer {
  return Buffer.from("This is a plain text file pretending to be a PDF.", "utf-8");
}

/**
 * Not a real encrypted PDF (pdf-lib can't author encryption) — just enough
 * structure to exercise the `/Encrypt`-trailer heuristic in
 * `validatePdfBytes` directly, independent of the native parser.
 */
export function encryptedLikeBytes(): Buffer {
  const body = "%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n";
  const trailer = "\ntrailer\n<< /Size 2 /Root 1 0 R /Encrypt 3 0 R /ID [<abc><abc>] >>\n%%EOF";
  return Buffer.from(body + trailer, "latin1");
}

// ---------------------------------------------------------------------------
// Verification-engine fixtures — synthetic bank-statement-shaped ledgers.
// Column x-positions are fixed and shared so BALANCE_BREAK/DUPLICATE_TRANSACTION's
// header-based column detection has a consistent, realistic layout to work with.
// ---------------------------------------------------------------------------

const LEDGER_COL_X = { date: 72, desc: 140, debit: 340, credit: 420, balance: 500 };

export interface LedgerRow {
  date: string;
  desc: string;
  debit?: string;
  credit?: string;
  balance: string;
}

async function buildLedgerPdf(title: string, rows: LedgerRow[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE.width, PAGE.height]);
  page.drawText(title, { x: 72, y: 750, size: 18, font: bold });
  page.drawText("statements.example.com/support", { x: 300, y: 750, size: 10, font, color: rgb(0.1, 0.2, 0.6) });

  // A real /Link annotation near the title, well clear of the table — gives
  // fixtures built on this ledger a second, distinctly-positioned real
  // finding (an extracted fact) alongside whatever the table produces, so
  // tests can verify switching between findings actually moves the
  // highlight, not just that a highlight exists.
  const linkAnnot = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [300, 745, 480, 760],
    Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of("https://statements.example.com/support") },
  });
  page.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(linkAnnot)]));

  const headerY = 710;
  const rowHeight = 22;
  const headers: [keyof typeof LEDGER_COL_X, string][] = [
    ["date", "Date"],
    ["desc", "Description"],
    ["debit", "Debit"],
    ["credit", "Credit"],
    ["balance", "Balance"],
  ];
  for (const [key, label] of headers) {
    page.drawText(label, { x: LEDGER_COL_X[key], y: headerY, size: 10, font: bold });
  }

  rows.forEach((row, i) => {
    const y = headerY - (i + 1) * rowHeight;
    page.drawText(row.date, { x: LEDGER_COL_X.date, y, size: 9, font });
    page.drawText(row.desc, { x: LEDGER_COL_X.desc, y, size: 9, font });
    if (row.debit) page.drawText(row.debit, { x: LEDGER_COL_X.debit, y, size: 9, font });
    if (row.credit) page.drawText(row.credit, { x: LEDGER_COL_X.credit, y, size: 9, font });
    page.drawText(row.balance, { x: LEDGER_COL_X.balance, y, size: 9, font });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/** Every row's balance is internally consistent — should verify CLEAR. */
export function cleanStatementRows(): LedgerRow[] {
  return [
    { date: "01 Apr", desc: "Opening", balance: "10000.00" },
    { date: "02 Apr", desc: "Salary", credit: "5000.00", balance: "15000.00" },
    { date: "03 Apr", desc: "Rent", debit: "3000.00", balance: "12000.00" },
    { date: "04 Apr", desc: "Groceries", debit: "1000.00", balance: "11000.00" },
    { date: "05 Apr", desc: "Refund", credit: "500.00", balance: "11500.00" },
  ];
}

export async function cleanStatementPdf(): Promise<Buffer> {
  return buildLedgerPdf("Clean Statement", cleanStatementRows());
}

/** Row 4's balance is wrong by 1500 — should trigger BALANCE_BREAK/FAIL. */
export function arithmeticInconsistencyRows(): LedgerRow[] {
  return [
    { date: "01 Apr", desc: "Opening", balance: "10000.00" },
    { date: "02 Apr", desc: "Salary", credit: "5000.00", balance: "15000.00" },
    { date: "03 Apr", desc: "Rent", debit: "3000.00", balance: "12000.00" },
    { date: "04 Apr", desc: "Groceries", debit: "1000.00", balance: "12500.00" }, // should be 11000.00
    { date: "05 Apr", desc: "Refund", credit: "500.00", balance: "13000.00" },
  ];
}

export async function arithmeticInconsistencyPdf(): Promise<Buffer> {
  return buildLedgerPdf("Statement With Balance Break", arithmeticInconsistencyRows());
}

/** Two rows share the same date and debit amount — should trigger DUPLICATE_TRANSACTION/REVIEW. */
export function duplicateTransactionRows(): LedgerRow[] {
  return [
    { date: "01 Apr", desc: "Opening", balance: "10000.00" },
    { date: "02 Apr", desc: "Coffee shop", debit: "250.00", balance: "9750.00" },
    { date: "02 Apr", desc: "Coffee shop", debit: "250.00", balance: "9500.00" },
    { date: "03 Apr", desc: "Rent", debit: "3000.00", balance: "6500.00" },
  ];
}

export async function duplicateTransactionPdf(): Promise<Buffer> {
  return buildLedgerPdf("Statement With Duplicate Charge", duplicateTransactionRows());
}

/** A ledger-shaped table with no debit/credit/balance headers at all — BALANCE_BREAK/DUPLICATE_TRANSACTION must both report insufficient-data, not guess. */
export async function tableWithoutLedgerHeadersPdf(): Promise<Buffer> {
  return tableHeavyPdf();
}

/** Scanned page with no text layer, for OCR_LOW_CONFIDENCE positive-case testing. */
export async function ocrLowConfidencePdf(): Promise<Buffer> {
  return scannedPdf();
}
