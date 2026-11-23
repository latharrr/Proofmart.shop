export interface PipelineStage {
  i: string;
  name: string;
  body: string;
}

// Describes only what lib/api/pipeline.ts and lib/verification actually do,
// in the order they run. No timings: the only real ones are a single sample
// scan's, and a number that varies with every document is not a claim.
export const PIPELINE: PipelineStage[] = [
  { i: "01", name: "Inspect", body: "Confirms the bytes are a real PDF and classifies it as text-based, scanned or mixed." },
  { i: "02", name: "Extract", body: "Recovers every text run with its position. Pages with no usable text layer fall back to OCR, run in-process." },
  { i: "03", name: "Reconstruct tables", body: "Rebuilds the ledger from column occupancy: which runs share an x-range, row by row." },
  { i: "04", name: "Markers", body: "Six fixed rules re-check the rebuilt rows: balances, carry-forwards, date order, duplicates, OCR and encoding." },
  { i: "05", name: "Verdict", body: "A fixed precedence, not a score: any FAIL makes it FAIL, else any REVIEW makes it REVIEW, else CLEAR." },
];

// The marker catalogue on the home page reads lib/verification/registry.ts
// directly (components/home/markers-section.tsx), so there is no second
// list here to drift out of sync.

export interface Integration {
  name: string;
  /** What you need before you can use it. */
  kind: string;
  body: string;
  /** The machine string a developer would actually type or see. */
  code: string;
}

export const INTEGRATIONS: Integration[] = [
  { name: "Web upload", kind: "No account", body: "Drop, paste or pick a PDF on this page. Signed-out uploads are deleted when the scan finishes.", code: "drag · paste · click" },
  { name: "API", kind: "API key", body: "Three depths of one pipeline: classify, extract, or the full verification.", code: "/v1/verify · /v1/extract · /v1/inspect" },
  { name: "Webhooks", kind: "API key", body: "Each result is POSTed to your URL, HMAC-signed. Six attempts: at once, then +1m, +5m, +30m, +2h, +12h.", code: "verification.completed · .failed" },
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
      { label: "Evidence rail", href: "/#product" },
      { label: "How it works", href: "/#pipeline" },
      { label: "Markers", href: "/#markers" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    h: "API",
    links: [
      { label: "Response & dossier", href: "/#outputs" },
      { label: "Integrate", href: "/#integrate" },
      { label: "API keys", href: "/account/api-keys" },
      { label: "Webhooks", href: "/account/webhooks" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "My documents", href: "/documents" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    h: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refunds" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: "/contact" },
    ],
  },
];
