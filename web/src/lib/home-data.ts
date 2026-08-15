export interface PipelineStage {
  i: string;
  name: string;
  ms: string;
  body: string;
  signal: string;
}

export const PIPELINE: PipelineStage[] = [
  {
    i: "01",
    name: "Ingest",
    ms: "210 ms",
    body: "Byte-exact PDF parse. Object streams decoded, xref reconstructed, embedded fonts hashed against the template registry.",
    signal: "producer · xref · fonts",
  },
  {
    i: "02",
    name: "Extract",
    ms: "1.4 s",
    body: "Text runs recovered with sub-pixel coordinates. Table structure inferred from column occupancy, not ruled lines.",
    signal: "runs · cells · glyphs",
  },
  {
    i: "03",
    name: "Reason",
    ms: "2.9 s",
    body: "Domain rules run over the run graph: arithmetic identities, template match, glyph metrics, semantic outliers.",
    signal: "markers · rules · verdict",
  },
  {
    i: "04",
    name: "Decide",
    ms: "260 ms",
    body: "Findings are ranked by verdict precedence, FAIL before REVIEW before CLEAR, and returned as JSON with a per-finding coordinate box for audit.",
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
  kind: string;
  body: string;
}

export const INTEGRATIONS: Integration[] = [
  { name: "Upload", kind: "live today", body: "The upload flow on this page. Drop, paste, or pick a PDF and get real findings back, no account required." },
  { name: "Webhook", kind: "planned", body: "Callback delivery for async jobs, so you don't have to hold a connection open. Not yet built." },
  { name: "CLI", kind: "planned", body: "A terminal client for scripted scans, so runs fit into an existing pipeline. Not yet built." },
  { name: "Verify", kind: "planned", body: "Offline signature verification against a published key. Findings aren't signed yet, so there's no key to verify against." },
];

export interface PricingTier {
  tier: string;
  price: string;
  unit: string;
  scan: string;
  body: string;
  cta: string;
  included: string[];
  highlight?: boolean;
}

export const PRICING: PricingTier[] = [
  {
    tier: "Team",
    price: "₹0.60",
    unit: "per finding",
    scan: "₹8 / scan",
    body: "For teams verifying customer-supplied documents in a review queue.",
    cta: "Start with 500 free findings",
    included: ["Web upload + JSON findings", "Rail review app", "Email support"],
  },
  {
    tier: "Growth",
    price: "₹0.42",
    unit: "per finding",
    scan: "₹6 / scan",
    body: "For teams running ProofMart in the underwriting loop.",
    cta: "Book a pipeline review",
    included: ["Everything in Team", "Custom marker rules", "Priority email"],
    highlight: true,
  },
  {
    tier: "Sovereign",
    price: "Custom",
    unit: "annual",
    scan: "unmetered",
    body: "For deployments that cannot leave your infrastructure. Scope defined together.",
    cta: "Speak to the founding team",
    included: ["Deployed in your environment", "Marker source access", "Named forensic contact", "Custom terms"],
  },
];

export interface FooterColumn {
  h: string;
  links: string[];
}

export const FOOTER: FooterColumn[] = [
  { h: "Product", links: ["Pipeline", "Marker catalog", "Dossier format", "Changelog", "Status page"] },
  { h: "Developers", links: ["REST reference", "Webhooks", "CLI", "Verify signatures", "Sample vault"] },
  { h: "Company", links: ["Manifesto", "Trust & security", "Careers · 4", "Press kit", "Contact"] },
];
