import { TXNS, fmt } from "@/lib/evidence-data";

/**
 * Draws a bank-statement page onto a canvas (A4 proportions) for use as the
 * paper texture in the document scene. The examined page also carries the
 * flagged row (BALANCE_BREAK, row 17) in a fail wash; its rectangle is
 * returned in UV space so the 3D pin box can sit exactly around it.
 *
 * The bank is fictional (Northwind, the classic sample-data name).
 */

export const PAGE_ASPECT = 1.414; // height / width

export type StatementPage = {
  canvas: HTMLCanvasElement;
  /** Flagged row rectangle in UV space (0..1, origin top-left), when flagged. */
  pin?: { u0: number; v0: number; u1: number; v1: number };
};

type Fonts = { sans: string; mono: string };

function readFonts(): Fonts {
  const cs = getComputedStyle(document.documentElement);
  const sans = cs.getPropertyValue("--font-geist-sans").trim() || "system-ui";
  const mono = cs.getPropertyValue("--font-geist-mono").trim() || "ui-monospace";
  return { sans: `${sans}, system-ui, sans-serif`, mono: `${mono}, ui-monospace, monospace` };
}

/** Make sure both faces are actually loaded before drawing (canvas won't wait). */
export async function loadStatementFonts(): Promise<Fonts> {
  const f = readFonts();
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load(`400 20px ${f.sans}`),
        document.fonts.load(`500 20px ${f.sans}`),
        document.fonts.load(`400 20px ${f.mono}`),
        document.fonts.load(`500 20px ${f.mono}`),
      ]);
    } catch {
      /* fall back to whatever is available */
    }
  }
  return f;
}

const INK = "#0b0c10";
const MUTE = "#5d6172";
const LINE = "#d9dbe6";
const HAZE = "#eceef5";
const FAIL = "#e5342b";

const EARLY_ROWS = [
  { i: 1, date: "13 Apr", desc: "BALANCE B/F FROM PAGE 3", debit: null, credit: null, balance: 103870.0 },
  { i: 2, date: "02 Apr", desc: "NEFT IN/FREELANCE-0412", debit: null, credit: 9500.0, balance: 34500.0 },
  { i: 3, date: "04 Apr", desc: "UPI/zomato@hdfc/8821", debit: 640.0, credit: null, balance: 33860.0 },
  { i: 4, date: "06 Apr", desc: "BILLPAY/BESCOM ELEC", debit: 2310.0, credit: null, balance: 31550.0 },
  { i: 5, date: "09 Apr", desc: "ACH DR/MF-SIP 4410", debit: 6550.0, credit: null, balance: 25000.0 },
];

// Continues from the (wrong) balance the document shows on row 17.
const LATE_ROWS = [
  { i: 18, date: "26 Apr", desc: "UPI/swiggy@icici/2291", debit: 486.0, credit: null, balance: 91224.0 },
  { i: 19, date: "27 Apr", desc: "NACH DR/LIC PREMIUM", debit: 4210.0, credit: null, balance: 87014.0 },
  { i: 20, date: "28 Apr", desc: "NEFT IN/REFUND-ORD-7731", debit: null, credit: 1299.0, balance: 88313.0 },
  { i: 21, date: "29 Apr", desc: "POS/RELIANCE FRESH", debit: 1603.0, credit: null, balance: 86710.0 },
  { i: 22, date: "30 Apr", desc: "INT CREDIT Q4", debit: null, credit: 5000.0, balance: 91710.0 },
];

export function drawStatement(
  fonts: Fonts,
  { width = 1024, page = 4, flagged = false, seed = 0 }: { width?: number; page?: number; flagged?: boolean; seed?: number },
): StatementPage {
  const W = width;
  const H = Math.round(width * PAGE_ASPECT);
  const s = W / 1024; // design at 1024 wide
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(s, s);
  const w = 1024;
  const h = 1024 * PAGE_ASPECT;
  const m = 76;

  // Paper
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Header: mark + bank name
  ctx.fillStyle = "#2b2e3a";
  roundRect(ctx, m, 72, 46, 46, 10);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `500 22px ${fonts.sans}`;
  ctx.textBaseline = "middle";
  ctx.fillText("N", m + 15, 96);
  ctx.fillStyle = INK;
  ctx.font = `500 25px ${fonts.sans}`;
  ctx.fillText("Northwind Bank", m + 64, 89);
  ctx.fillStyle = MUTE;
  ctx.font = `400 16px ${fonts.sans}`;
  ctx.fillText("Koramangala branch · IFSC NWBK0001284", m + 64, 113);

  ctx.textAlign = "right";
  ctx.fillStyle = MUTE;
  ctx.font = `500 15px ${fonts.sans}`;
  ctx.fillText("STATEMENT OF ACCOUNT", w - m, 86);
  ctx.fillStyle = INK;
  ctx.font = `400 17px ${fonts.mono}`;
  ctx.fillText("01 APR 2026 – 30 APR 2026", w - m, 112);
  ctx.textAlign = "left";

  hr(ctx, m, 152, w - m);

  // Account block
  const pairs: [string, string][] = [
    ["Account holder", "A. K. SHARMA"],
    ["Account number", "XXXX XXXX 4821"],
    ["Account type", "SAVINGS · INR"],
    ["Customer ID", "NW-00718842"],
  ];
  pairs.forEach(([k, v], i) => {
    const x = m + (i % 2) * 436;
    const y = 196 + Math.floor(i / 2) * 58;
    ctx.fillStyle = MUTE;
    ctx.font = `400 15px ${fonts.sans}`;
    ctx.fillText(k, x, y);
    ctx.fillStyle = INK;
    ctx.font = `400 19px ${fonts.mono}`;
    ctx.fillText(v, x, y + 25);
  });

  // Summary tiles
  const tiles: [string, string][] = [
    ["Opening", "25,000.00"],
    ["Credits", "1,51,120.00"],
    ["Debits", "84,410.00"],
    ["Closing", "91,710.00"],
  ];
  const tw = (w - 2 * m - 3 * 14) / 4;
  tiles.forEach(([k, v], i) => {
    const x = m + i * (tw + 14);
    ctx.fillStyle = HAZE;
    roundRect(ctx, x, 330, tw, 78, 12);
    ctx.fill();
    ctx.fillStyle = MUTE;
    ctx.font = `500 13px ${fonts.sans}`;
    ctx.fillText(k.toUpperCase(), x + 16, 356);
    ctx.fillStyle = INK;
    ctx.font = `400 21px ${fonts.mono}`;
    ctx.fillText(v, x + 16, 386);
  });

  // Table
  const cols = { date: m, desc: m + 108, debit: w - m - 312, credit: w - m - 168, bal: w - m };
  const top = 452;
  ctx.fillStyle = "#f3f4f9";
  roundRect(ctx, m - 10, top, w - 2 * m + 20, 42, 8);
  ctx.fill();
  ctx.fillStyle = MUTE;
  ctx.font = `500 13px ${fonts.sans}`;
  ctx.fillText("DATE", cols.date, top + 22);
  ctx.fillText("DESCRIPTION", cols.desc, top + 22);
  ctx.textAlign = "right";
  ctx.fillText("DEBIT", cols.debit, top + 22);
  ctx.fillText("CREDIT", cols.credit, top + 22);
  ctx.fillText("BALANCE", cols.bal, top + 22);
  ctx.textAlign = "left";

  // Rows: page 4 shows the real sample; other pages a shuffled variant.
  let rows = [...EARLY_ROWS.slice(0, 1), ...TXNS.slice(3), ...LATE_ROWS];
  if (page !== 4) {
    // Other pages: same kinds of rows, rotated, with a running balance that adds up.
    let bal = 40000 + seed * 13250;
    rows = rows.map((_, k) => {
      const src = rows[(k * 5 + seed * 3 + 2) % rows.length];
      const debit = src.debit;
      const credit = src.credit ?? (debit ? null : 2500 + seed * 700);
      bal = bal - (debit ?? 0) + (credit ?? 0);
      const day = String(Math.min(28, 1 + k * 2 + seed)).padStart(2, "0");
      return { ...src, desc: src.desc.startsWith("BALANCE") ? "UPI/rent@okaxis/APR" : src.desc, i: k + 1, date: `${day} Apr`, debit, credit, balance: bal };
    });
  }
  const rh = 50;
  let pin: StatementPage["pin"];
  rows.forEach((r, k) => {
    const y = top + 50 + k * rh;
    const isBreak = flagged && "breakBalance" in r && r.breakBalance;
    if (isBreak) {
      ctx.fillStyle = "rgba(229,52,43,0.10)";
      roundRect(ctx, m - 10, y, w - 2 * m + 20, rh, 8);
      ctx.fill();
      pin = { u0: (m - 18) / w, v0: (y - 6) / h, u1: (w - m + 18) / w, v1: (y + rh + 6) / h };
    } else if (k % 2 === 1) {
      ctx.fillStyle = "#f8f9fc";
      ctx.fillRect(m - 10, y, w - 2 * m + 20, rh);
    }
    const cy = y + rh / 2 + 1;
    ctx.fillStyle = MUTE;
    ctx.font = `500 17px ${fonts.mono}`;
    ctx.fillText(r.date.toUpperCase(), cols.date, cy);
    ctx.fillStyle = INK;
    ctx.font = `500 17px ${fonts.mono}`;
    ctx.fillText(r.desc, cols.desc, cy);
    ctx.textAlign = "right";
    ctx.fillStyle = r.debit ? INK : LINE;
    ctx.fillText(r.debit ? fmt(r.debit) : "—", cols.debit, cy);
    ctx.fillStyle = r.credit ? INK : LINE;
    ctx.fillText(r.credit ? fmt(r.credit) : "—", cols.credit, cy);
    ctx.fillStyle = isBreak ? FAIL : INK;
    ctx.fillText(fmt(r.balance), cols.bal, cy);
    ctx.textAlign = "left";
  });
  const tableEnd = top + 50 + rows.length * rh;
  hr(ctx, m, tableEnd + 10, w - m);

  // Closing line + footer
  ctx.fillStyle = MUTE;
  ctx.font = `400 15px ${fonts.sans}`;
  ctx.fillText("Closing balance as per statement", m, tableEnd + 48);
  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = `400 19px ${fonts.mono}`;
  ctx.fillText(page === 4 ? "91,710.00" : fmt(rows[rows.length - 1].balance), w - m, tableEnd + 48);
  ctx.textAlign = "left";

  ctx.fillStyle = "#a3a7b8";
  ctx.font = `400 13px ${fonts.sans}`;
  ctx.fillText("This is a computer-generated statement and does not require a signature.", m, h - 70);
  ctx.textAlign = "right";
  ctx.font = `400 14px ${fonts.mono}`;
  ctx.fillText(`PAGE ${page} OF 6`, w - m, h - 70);
  ctx.textAlign = "left";

  return { canvas, pin };
}

function hr(ctx: CanvasRenderingContext2D, x0: number, y: number, x1: number) {
  ctx.fillStyle = LINE;
  ctx.fillRect(x0, y, x1 - x0, 1.5);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The FAIL / REVIEW / CLEAR chip face. */
export function drawChip(fonts: Fonts, label: string, { width = 512 }: { width?: number } = {}) {
  const W = width;
  const H = Math.round(width * 0.4);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const s = W / 512;
  ctx.scale(s, s);
  ctx.clearRect(0, 0, 512, 205);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(96, 102, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `500 88px ${fonts.sans}`;
  ctx.textBaseline = "middle";
  ctx.fillText(label, 132, 106);
  return canvas;
}

/** A small finding card: marker id + arithmetic, as on the real report. */
export function drawFindingCard(fonts: Fonts, { width = 768 }: { width?: number } = {}) {
  const W = width;
  const H = Math.round(width * 0.42);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const s = W / 768;
  ctx.scale(s, s);
  const h = 768 * 0.42;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 768, h);
  ctx.fillStyle = FAIL;
  ctx.fillRect(0, 0, 8, h);
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.font = `400 26px ${fonts.mono}`;
  ctx.fillText("BALANCE_BREAK", 40, 52);
  ctx.textAlign = "right";
  ctx.fillStyle = MUTE;
  ctx.font = `400 22px ${fonts.mono}`;
  ctx.fillText("p4 · r17", 728, 52);
  ctx.textAlign = "left";
  ctx.fillStyle = MUTE;
  ctx.font = `400 23px ${fonts.sans}`;
  ctx.fillText("Running balance is off by ₹5,000.00", 40, 102);
  ctx.fillStyle = "#eef0f6";
  roundRect(ctx, 32, 136, 704, 150, 14);
  ctx.fill();
  ctx.font = `400 23px ${fonts.mono}`;
  ctx.fillStyle = INK;
  ctx.fillText("84,210.00 + 12,500.00 = 96,710.00", 56, 184);
  ctx.fillStyle = MUTE;
  ctx.fillText("document shows", 56, 238);
  ctx.textAlign = "right";
  ctx.fillStyle = FAIL;
  ctx.fillText("91,710.00", 712, 238);
  ctx.textAlign = "left";
  return canvas;
}
