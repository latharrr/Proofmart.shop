export type Verdict = "CLEAR" | "REVIEW" | "FAIL" | "INCONCLUSIVE";

export const VERDICT: Record<Verdict, { color: string; fill: string; glyph: string }> = {
  CLEAR: { color: "#1F6B4A", fill: "rgba(31,107,74,0.10)", glyph: "=" },
  REVIEW: { color: "#A66A00", fill: "rgba(166,106,0,0.10)", glyph: "~" },
  FAIL: { color: "#B4231F", fill: "rgba(180,35,31,0.10)", glyph: "×" },
  INCONCLUSIVE: { color: "#5A6570", fill: "rgba(90,101,112,0.10)", glyph: "?" },
};

export interface Transaction {
  i: number;
  date: string;
  desc: string;
  debit: number | null;
  credit: number | null;
  balance: number;
  breakBalance?: boolean;
}

export const TXNS: Transaction[] = [
  { i: 6, date: "12 Apr", desc: "SALARY CREDIT HDFCEMP", debit: null, credit: 84120.0, balance: 109120.0 },
  { i: 7, date: "12 Apr", desc: "UPI/rahul@ybl/456102", debit: 250.0, credit: null, balance: 108870.0 },
  { i: 8, date: "13 Apr", desc: "ATM WDL BLR-KRMR-013", debit: 5000.0, credit: null, balance: 103870.0 },
  { i: 9, date: "14 Apr", desc: "POS/AMAZON RETAIL IN", debit: 3499.0, credit: null, balance: 100371.0 },
  { i: 10, date: "15 Apr", desc: "EMI/HDFC-HOME LOAN 88112", debit: 32180.0, credit: null, balance: 68191.0 },
  { i: 11, date: "16 Apr", desc: "RTGS IN/CLIENT-INV-1092", debit: null, credit: 45000.0, balance: 113191.0 },
  { i: 12, date: "17 Apr", desc: "POS/BIGBASKET GROCERY", debit: 2140.0, credit: null, balance: 111051.0 },
  { i: 13, date: "18 Apr", desc: "UPI/mom@sbi/PERSONAL", debit: 10000.0, credit: null, balance: 101051.0 },
  { i: 14, date: "20 Apr", desc: "IMPS IN /INVOICE 2081", debit: null, credit: 0.0, balance: 101051.0 },
  { i: 15, date: "22 Apr", desc: "POS/APOLLO PHARMACY", debit: 1890.0, credit: null, balance: 99161.0 },
  { i: 16, date: "24 Apr", desc: "POS/UBER 5T4A9", debit: 14951.0, credit: null, balance: 84210.0 },
  { i: 17, date: "25 Apr", desc: "IMPS IN/JOE-K PAYMENT", debit: null, credit: 12500.0, balance: 91710.0, breakBalance: true },
];

export interface Finding {
  id: string;
  verdict: Verdict;
  marker: string;
  addr1: string;
  addr2: string;
  explanation: string;
  arithmetic: string;
  rect: { x: number; y: number; w: number; h: number };
}

export const FINDINGS: Finding[] = [
  {
    id: "f1",
    verdict: "FAIL",
    marker: "BALANCE_BREAK",
    addr1: "p4·r17",
    addr2: "502,674",
    explanation: "Running balance differs from prior + credit − debit by ₹5,000.00.",
    arithmetic: "84,210.00 + 12,500.00 = 96,710.00\ndocument shows           91,710.00",
    rect: { x: 548, y: 528, w: 68, h: 22 },
  },
  {
    id: "f2",
    verdict: "FAIL",
    marker: "CROSS_PAGE_TOTAL_MISMATCH",
    addr1: "p3→p4",
    addr2: "548,88",
    explanation: "Balance carried from page 3 to page 4 differs by ₹1,240.00.",
    arithmetic: "page 3 closing balance 96,450.00 + 0.00 − 0.00 = 96,450.00\npage 4 opening row shows              97,690.00",
    rect: { x: 548, y: 88, w: 68, h: 22 },
  },
  {
    id: "f3",
    verdict: "REVIEW",
    marker: "DUPLICATE_TRANSACTION",
    addr1: "p2·r04,r07",
    addr2: "214,338",
    explanation: "2 transactions share date 08 Apr and amount 2,500.00.",
    arithmetic: "matched on identical date + amount across 2 rows\ndescription text was not compared",
    rect: { x: 214, y: 338, w: 96, h: 22 },
  },
  {
    id: "f4",
    verdict: "REVIEW",
    marker: "OCR_LOW_CONFIDENCE",
    addr1: "p4·r14",
    addr2: "118,452",
    explanation: "Description text OCR confidence below the 0.75 threshold.",
    arithmetic: "confidence  0.62\nthreshold   0.75",
    rect: { x: 118, y: 452, w: 138, h: 22 },
  },
];

export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "·";
  if (n === 0) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MONO = "var(--font-mono), ui-monospace, monospace";
export const SANS = "var(--font-sans), system-ui, sans-serif";
