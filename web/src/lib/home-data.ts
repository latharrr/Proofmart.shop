export interface PipelineStage {
  i: string;
  name: string;
  ms: string;
  body: string;
  signal: string;
}

// Describes only what lib/api/pipeline.ts and lib/verification actually do.
// An earlier version claimed template-registry matching and glyph-metric
// checks; the registry's own docstring explains why neither exists, so the
// page must not say they do.
export const PIPELINE: PipelineStage[] = [
  {
    i: "01",
    name: "Inspect",
    ms: "210 ms",
    body: "Confirms the bytes are a real PDF, then classifies it as text-based, scanned or mixed, with a confidence score.",
    signal: "pdfType · confidence · pages",
  },
  {
    i: "02",
    name: "Extract",
    ms: "1.4 s",
    body: "Recovers every text run with its position on the page. Pages without a usable text layer go through OCR, run in-process.",
    signal: "runs · boxes · ocr",
  },
  {
    i: "03",
    name: "Reconcile",
    ms: "2.9 s",
    body: "Rebuilds the ledger from column positions, then re-checks it: running balances, page carry-forwards, date order, duplicates.",
    signal: "markers · evidence",
  },
  {
    i: "04",
    name: "Decide",
    ms: "260 ms",
    body: "A fixed rule, not a score: any FAIL finding makes the verdict FAIL, else any REVIEW makes it REVIEW, else CLEAR.",
    signal: "verdict · findings · coordinates",
  },
];

export type MarkerCategory = "Arithmetic" | "Provenance" | "Typography" | "Extraction" | "Semantic";
export type MarkerVerdict = "FAIL" | "REVIEW" | "CLEAR";

export interface Marker {
  id: string;
  cat: MarkerCategory;
  verdict: MarkerVerdict;
  desc: string;
  cites: string;
}

// Mirrors the live MARKER_REGISTRY in lib/verification/registry.ts exactly —
// id, category, and verdict per marker. Keep both lists in sync: this page
// claims to be the marker catalog, so it must never show a marker the
// verification engine doesn't actually run.
export const MARKERS: Marker[] = [
  { id: "BALANCE_BREAK", cat: "Arithmetic", verdict: "FAIL", desc: "Running balance disagrees with prior balance plus credit minus debit in a reconstructed ledger table.", cites: "row · math · box" },
  { id: "CROSS_PAGE_TOTAL_MISMATCH", cat: "Arithmetic", verdict: "FAIL", desc: "Running balance fails to carry forward correctly across a page break.", cites: "row · page · box" },
  { id: "DATE_SEQUENCE_ANOMALY", cat: "Semantic", verdict: "REVIEW", desc: "A row's date is earlier than the row immediately before it in a reconstructed ledger.", cites: "row · date · box" },
  { id: "DUPLICATE_TRANSACTION", cat: "Semantic", verdict: "REVIEW", desc: "Two or more rows share an identical date and amount.", cites: "rows · match" },
  { id: "OCR_LOW_CONFIDENCE", cat: "Extraction", verdict: "REVIEW", desc: "Page classified as needing OCR: its text layer is unreliable or absent.", cites: "page · confidence" },
  { id: "ENCODING_ANOMALY", cat: "Extraction", verdict: "REVIEW", desc: "Broken font encoding or CID mapping detected somewhere in the document.", cites: "document · encoding" },
];

export const MARKER_TABS = ["All", "Arithmetic", "Semantic", "Extraction"] as const;

export interface Integration {
  name: string;
  /** What you need before you can use it. */
  kind: string;
  body: string;
  /** The machine string a developer would actually type or see. */
  code: string;
}

export const INTEGRATIONS: Integration[] = [
  { name: "Upload", kind: "No account", body: "The rail at the top of this page. Drop, paste or pick a PDF and get real findings back.", code: "drag · paste · click" },
  { name: "REST API", kind: "API key", body: "Three depths of the same pipeline: classify only, extract, or the full verification.", code: "/v1/verify · /v1/extract · /v1/inspect" },
  { name: "Webhooks", kind: "API key", body: "Every verification also posts its result to your URL, HMAC-signed and retried on failure.", code: "verification.completed · .failed" },
  { name: "CLI", kind: "API key", body: "A small, dependency-free client for the same public API, for scripts and batch jobs.", code: "proofmart verify statement.pdf" },
];

export interface PricingTier {
  tier: string;
  price: string;
  unit: string;
  body: string;
  cta: string;
  included: string[];
  highlight?: boolean;
}

// Mirrors the live PLANS in lib/billing/plans.ts exactly — flat monthly
// subscription, not usage-metered. Keep both in sync: this page claims to
// be the real pricing, so it must never show a plan the billing code
// doesn't actually implement.
export const PRICING: PricingTier[] = [
  {
    tier: "Free",
    price: "₹0",
    unit: "/ month",
    body: "For trying ProofMart against real documents before committing to a plan.",
    cta: "Start free",
    included: ["50 verification calls a month", "All six markers, same engine as Pro", "Upload, REST API, webhooks and CLI"],
  },
  {
    tier: "Pro",
    price: "₹999",
    unit: "/ month",
    body: "For teams running ProofMart in a review or underwriting loop.",
    cta: "Upgrade to Pro",
    included: ["2,000 verification calls a month", "Everything in Free", "Priority email support"],
    highlight: true,
  },
];

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  h: string;
  links: FooterLink[];
}

// Every link here resolves to something that actually exists — an anchor on
// this page or a real route. The previous version listed 15 links of which
// 14 were href="#" placeholders (Changelog, Status page, Press kit, a
// "Careers · 4" headcount, and so on). On a product whose entire pitch is
// not claiming more than it can evidence, a footer full of dead ends was
// the wrong thing to ship. Anything added back here needs a destination.
export const FOOTER: FooterColumn[] = [
  {
    h: "Product",
    links: [
      { label: "How it works", href: "/#pipeline" },
      { label: "Marker catalog", href: "/#markers" },
      { label: "Response & dossier", href: "/#outputs" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    h: "Developers",
    links: [
      { label: "Integrations", href: "/#integrate" },
      { label: "API keys", href: "/account/api-keys" },
      { label: "Webhooks", href: "/account/webhooks" },
      { label: "My documents", href: "/documents" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "Trust & security", href: "/security" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
];
