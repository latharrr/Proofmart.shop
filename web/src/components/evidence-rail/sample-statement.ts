import type { RailFinding } from "@/lib/pdf/types";
import { FINDINGS } from "@/lib/evidence-data";

/**
 * The bundled sample scan: a six-page April statement, laid out on the same
 * 640×800 mock page the rail has always drawn, plus the four findings it
 * carries. Every finding names the page it lives on and the rows it boxes,
 * and the boxes are computed from the same row geometry the page is drawn
 * with, so clicking a finding can turn to its page and land on its row.
 *
 * Row numbers are per page (p4·r17 is the 17th row printed on page 4). The
 * numbers add up everywhere except where a finding says they don't:
 *   p2 r04 / r07  same date and amount            → DUPLICATE_TRANSACTION
 *   p3 closes 23,760.00, p4 brings 25,000.00 fwd  → CROSS_PAGE_TOTAL_MISMATCH
 *   p4 r14        description read at 0.62        → OCR_LOW_CONFIDENCE
 *   p4 r17        84,210 + 12,500 shown as 91,710 → BALANCE_BREAK
 */

export interface SampleRow {
  n: number;
  date: string;
  desc: string;
  debit: number | null;
  credit: number | null;
  balance: number;
  /** The printed balance is the one a finding disputes. */
  flagged?: boolean;
}

export interface SamplePage {
  page: number;
  period: string;
  rows: SampleRow[];
  /** Footer line: "Carried to p5 · 91,710.00", or the closing balance on the last page. */
  carried: { label: string; amount: number };
}

type Txn = [date: string, desc: string, amount: number];

/** Builds a page whose running balance adds up, from an opening balance. */
function ledger(open: number, openLabel: string, openDate: string, txns: Txn[]): SampleRow[] {
  const rows: SampleRow[] = [{ n: 1, date: openDate, desc: openLabel, debit: null, credit: null, balance: open }];
  let bal = open;
  txns.forEach(([date, desc, amount], k) => {
    bal = Math.round((bal + amount) * 100) / 100;
    rows.push({ n: k + 2, date, desc, debit: amount < 0 ? -amount : null, credit: amount > 0 ? amount : amount === 0 ? 0 : null, balance: bal });
  });
  return rows;
}

const P1 = ledger(48000, "OPENING BALANCE", "01 Apr", [
  ["01 Apr", "NACH DR/LIC PREMIUM", -4210],
  ["01 Apr", "UPI/rent@okaxis/APR", -18000],
  ["02 Apr", "POS/RELIANCE FRESH", -1603],
  ["02 Apr", "IMPS IN/FREELANCE-0412", 15000],
  ["03 Apr", "UPI/swiggy@icici/2291", -486],
  ["03 Apr", "ATM WDL BLR-KRMR-009", -3000],
  ["03 Apr", "POS/UBER 5T4A1", -212],
  ["04 Apr", "NEFT IN/REFUND-ORD-7731", 1299],
  ["04 Apr", "POS/AMAZON RETAIL IN", -2788],
]);

const P2 = ledger(34000, "BALANCE B/F FROM PAGE 1", "04 Apr", [
  ["05 Apr", "POS/BIGBASKET GROCERY", -1940],
  ["05 Apr", "UPI/bescom@ybl/ELEC-APR", -1300],
  ["06 Apr", "UPI/kumar@okmtb/RENT-SHARE", -2500],
  ["06 Apr", "POS/APOLLO PHARMACY", -640],
  ["06 Apr", "IMPS IN/JOE-K PAYMENT", 6140],
  ["06 Apr", "UPI/kumar@okmtb/RENT-SHARE", -2500],
  ["06 Apr", "ATM WDL BLR-KRMR-011", -2000],
  ["07 Apr", "POS/UBER 5T4A3", -500],
]);

const P3 = ledger(28760, "BALANCE B/F FROM PAGE 2", "07 Apr", [
  ["07 Apr", "POS/DMART HSR LAYOUT", -2315],
  ["07 Apr", "UPI/mom@sbi/PERSONAL", -5000],
  ["07 Apr", "IMPS IN/CASHBACK-MTB", 185],
  ["07 Apr", "POS/STARBUCKS KORAMANGALA", -590],
  ["08 Apr", "NEFT IN/CLIENT-INV-1087", 6500],
  ["08 Apr", "UPI/zomato@mtb/8812", -780],
  ["08 Apr", "ATM WDL BLR-KRMR-012", -3000],
]);

// Page 4 brings 25,000.00 forward although page 3 closed at 23,760.00.
const P4_HEAD = ledger(25000, "BALANCE B/F FROM PAGE 3", "08 Apr", [
  ["08 Apr", "UPI/swiggy@icici/2291", -486],
  ["09 Apr", "NEFT IN/REFUND-ORD-7790", 1299],
  ["10 Apr", "POS/RELIANCE FRESH", -1603],
  ["11 Apr", "INT CREDIT Q4", 790],
]);
P4_HEAD[0].flagged = true;

const P4_TAIL: SampleRow[] = [
  { n: 6, date: "12 Apr", desc: "SALARY CREDIT MERIDIANEMP", debit: null, credit: 84120, balance: 109120 },
  { n: 7, date: "12 Apr", desc: "UPI/rahul@ybl/456102", debit: 250, credit: null, balance: 108870 },
  { n: 8, date: "13 Apr", desc: "ATM WDL BLR-KRMR-013", debit: 5000, credit: null, balance: 103870 },
  { n: 9, date: "14 Apr", desc: "POS/AMAZON RETAIL IN", debit: 3499, credit: null, balance: 100371 },
  { n: 10, date: "15 Apr", desc: "EMI/MTB-HOME LOAN 88112", debit: 32180, credit: null, balance: 68191 },
  { n: 11, date: "16 Apr", desc: "RTGS IN/CLIENT-INV-1092", debit: null, credit: 45000, balance: 113191 },
  { n: 12, date: "17 Apr", desc: "POS/BIGBASKET GROCERY", debit: 2140, credit: null, balance: 111051 },
  { n: 13, date: "18 Apr", desc: "UPI/mom@sbi/PERSONAL", debit: 10000, credit: null, balance: 101051 },
  { n: 14, date: "20 Apr", desc: "IMPS IN /INVOICE 2O81", debit: null, credit: 0, balance: 101051 },
  { n: 15, date: "22 Apr", desc: "POS/APOLLO PHARMACY", debit: 1890, credit: null, balance: 99161 },
  { n: 16, date: "24 Apr", desc: "POS/UBER 5T4A9", debit: 14951, credit: null, balance: 84210 },
  { n: 17, date: "25 Apr", desc: "IMPS IN/JOE-K PAYMENT", debit: null, credit: 12500, balance: 91710, flagged: true },
];

const P5 = ledger(91710, "BALANCE B/F FROM PAGE 4", "25 Apr", [
  ["26 Apr", "UPI/swiggy@icici/2291", -486],
  ["27 Apr", "NACH DR/LIC PREMIUM", -4210],
  ["28 Apr", "NEFT IN/REFUND-ORD-7731", 1299],
  ["28 Apr", "POS/RELIANCE FRESH", -1603],
]);

const P6 = ledger(86710, "BALANCE B/F FROM PAGE 5", "29 Apr", [["30 Apr", "INT CREDIT Q4", 5000]]);

const last = (rows: SampleRow[]) => rows[rows.length - 1].balance;

export const SAMPLE_PAGES: SamplePage[] = [
  { page: 1, period: "01–04 APR 2025", rows: P1, carried: { label: "CARRIED TO P2", amount: last(P1) } },
  { page: 2, period: "04–07 APR 2025", rows: P2, carried: { label: "CARRIED TO P3", amount: last(P2) } },
  { page: 3, period: "07–08 APR 2025", rows: P3, carried: { label: "CARRIED TO P4", amount: last(P3) } },
  { page: 4, period: "08–25 APR 2025", rows: [...P4_HEAD, ...P4_TAIL], carried: { label: "CARRIED TO P5", amount: 91710 } },
  { page: 5, period: "25–28 APR 2025", rows: P5, carried: { label: "CARRIED TO P6", amount: last(P5) } },
  { page: 6, period: "29–30 APR 2025", rows: P6, carried: { label: "CLOSING BALANCE", amount: last(P6) } },
];

export const SAMPLE_PAGE_COUNT = SAMPLE_PAGES.length;

/* Mock-page geometry, shared by the drawing and the finding boxes. */
export const SAMPLE_VIEWBOX = { w: 640, h: 800 } as const;
export const ROW_TOP = 236;
export const ROW_H = 26;

/** The box around a whole printed row, in mock-page units. */
export function rowRect(n: number) {
  return { x: 26, y: ROW_TOP + (n - 1) * ROW_H + 1, w: 590, h: ROW_H - 2 };
}

export interface SampleFinding extends RailFinding {
  /** Page the finding is drawn on. */
  page: number;
  /** Every row it boxes (a duplicate boxes both). `rect` is the first. */
  rects: { x: number; y: number; w: number; h: number }[];
}

const byMarker = (m: string) => {
  const f = FINDINGS.find((x) => x.marker === m);
  if (!f) throw new Error(`sample finding ${m} missing`);
  return f;
};

function finding(marker: string, page: number, rows: number[], patch: Partial<RailFinding> = {}): SampleFinding {
  const base = byMarker(marker);
  const rects = rows.map(rowRect);
  return { ...base, ...patch, origin: "verification-finding", page, rects, rect: rects[0] };
}

export const SAMPLE_FINDINGS: SampleFinding[] = [
  finding("BALANCE_BREAK", 4, [17], {
    addr1: "p4·r17",
    addr2: "balance",
    explanation: "Running balance differs from prior + credit − debit by ₹5,000.00.",
    arithmetic: "84,210.00 + 12,500.00 = 96,710.00\ndocument shows           91,710.00",
  }),
  finding("CROSS_PAGE_TOTAL_MISMATCH", 4, [1], {
    addr1: "p3→p4·r01",
    addr2: "carry-forward",
    explanation: "Balance brought forward to page 4 differs from page 3's closing balance by ₹1,240.00.",
    arithmetic: "page 3 closing balance   23,760.00\npage 4 brought forward   25,000.00",
  }),
  finding("DUPLICATE_TRANSACTION", 2, [4, 7], {
    addr1: "p2·r04,r07",
    addr2: "date + amount",
    explanation: "2 transactions share date 06 Apr and amount 2,500.00.",
    arithmetic: "matched on identical date + amount across 2 rows\ndescription text was not compared",
  }),
  finding("OCR_LOW_CONFIDENCE", 4, [14], {
    addr1: "p4·r14",
    addr2: "description",
    explanation: "Description text OCR confidence below the 0.75 threshold.",
    arithmetic: "confidence  0.62\nthreshold   0.75",
  }),
];
