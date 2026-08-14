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
    body: "Domain rules run over the run graph — arithmetic identities, template match, glyph metrics, semantic outliers.",
    signal: "markers · rules · verdict",
  },
  {
    i: "04",
    name: "Attest",
    ms: "260 ms",
    body: "Findings collapsed to a Merkle root, signed ed25519, and returned with a per-finding coordinate box for audit.",
    signal: "signed · replay · webhook",
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

export const MARKERS: Marker[] = [
  { id: "BALANCE_BREAK", cat: "Arithmetic", verdict: "FAIL", desc: "Running balance disagrees with prior ± net movement.", cites: "row · math · box" },
  { id: "PRODUCER_MISMATCH", cat: "Provenance", verdict: "FAIL", desc: "PDF producer string is not on the issuer template roster.", cites: "metadata · roster" },
  { id: "FONT_METRIC_SHIFT", cat: "Typography", verdict: "REVIEW", desc: "Glyph advance width departs from surrounding text run.", cites: "glyph · run · box" },
  { id: "OCR_LOW_CONFIDENCE", cat: "Extraction", verdict: "REVIEW", desc: "Recognizer confidence below the 0.75 threshold on a cell used in reasoning.", cites: "cell · confidence" },
  { id: "DUP_TXN_HASH", cat: "Semantic", verdict: "FAIL", desc: "Two transactions share amount, counterparty, and reference within a 3-day window.", cites: "rows · window" },
  { id: "SIGNATURE_INVALID", cat: "Provenance", verdict: "FAIL", desc: "Detached digital signature does not validate against the issuer chain.", cites: "signature · chain" },
];

export const MARKER_TABS = ["All", "Arithmetic", "Provenance", "Typography", "Extraction", "Semantic"] as const;

export interface Integration {
  name: string;
  kind: string;
  body: string;
}

export const INTEGRATIONS: Integration[] = [
  { name: "REST", kind: "sync", body: "POST a PDF. Receive the signed dossier on the same request. 30 s timeout." },
  { name: "Webhook", kind: "async · replay", body: "Attach a callback URL; the dossier posts back keyed by request_id. Replay any request from the dashboard." },
  { name: "CLI", kind: "terminal", body: "colophon scan file.pdf writes JSON to stdout and drops the dossier PDF next to the source." },
  { name: "Verify", kind: "public key", body: "Every dossier is signed ed25519. Verify offline against the key at colophon.dev/.well-known/keys." },
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
    included: ["REST + webhook", "Signed dossier PDF", "Rail review app", "Email support"],
  },
  {
    tier: "Growth",
    price: "₹0.42",
    unit: "per finding",
    scan: "₹6 / scan",
    body: "For teams running Colophon in the underwriting loop.",
    cta: "Book a pipeline review",
    included: ["Everything in Team", "Webhook retries", "Custom marker rules", "Priority email"],
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
