# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developer-led. The buyer and first user is an engineer at an Indian lender, fintech, or verification company who wires `/v1/verify` into an onboarding, underwriting, or KYC flow and has to defend that choice to their team. The second audience reads what the engineer integrated: credit analysts, underwriters, risk and compliance reviewers who open a report and must decide whether a bank statement or financial PDF can be trusted, and later justify that decision. The marketing surface speaks to the developer; the workspace and report speak to the reviewer.

## Product Purpose

ProofMart is document forensics as an API. A PDF goes in; a structured report comes out, with every finding pinned to a pixel-coordinate box on a page, the arithmetic it used shown, and one verdict: `FAIL`, `REVIEW`, or `CLEAR`. Success is a reviewer who can point at the exact row that failed and an engineer who can trust that the same bytes always produce the same verdict.

## Positioning

Every claim is checkable. There is no model in the verification path: no LLM, classifier, or learned score. Findings are deterministic rules over extracted geometry and arithmetic, each with a citation (page, row, box) you can screenshot. A competitor selling "AI fraud scores" or confidence percentages cannot truthfully claim this.

## Operating Context

- Delivered four ways, one engine: web upload, the public API (`/v1/verify`, `/v1/inspect`, `/v1/extract`, `/v1/documents…`, unauthenticated `/v1/verify-signature`), HMAC-signed webhooks (`verification.completed` / `verification.failed`, six attempts over ~12h), and the `proofmart` CLI.
- Signed dossiers: a saved verification exports as a PDF signed with Ed25519 over a canonical payload including the sha256 of the verified bytes; anyone can verify it without an account.
- Pipeline: inspect → extract (OCR fallback) → reconstruct tables from column occupancy → markers → verdict (FAIL beats REVIEW beats CLEAR).
- Typical documents: Indian bank statements in INR (the bundled sample is a six-page April statement).
- App surfaces: home, security, login/sign-up/password flows, documents list, document report, account (API keys, webhooks, billing).

## Capabilities and Constraints

- Exactly six markers exist, and `web/src/lib/verification/registry.ts` is the source of truth: `BALANCE_BREAK`, `CROSS_PAGE_TOTAL_MISMATCH` (arithmetic, FAIL) · `DATE_SEQUENCE_ANOMALY`, `DUPLICATE_TRANSACTION` (semantic, REVIEW) · `OCR_LOW_CONFIDENCE`, `ENCODING_ANOMALY` (extraction, REVIEW). Nothing may be advertised that is not in the registry.
- Pricing is a placeholder (`lib/billing/plans.ts`: Free 50 verifies/month, Pro ₹999 for 2,000). Billing runs on Razorpay in INR. Do not present prices as final business decisions.
- CSP sets `font-src 'self'`: fonts must be self-hosted via `next/font`; font CDNs are blocked.
- The app degrades without env: with no services the home page renders and the Evidence Rail runs its bundled sample entirely in the browser.
- Stack: Next.js 16 App Router, React 19, Tailwind 4, Supabase, Vercel.

## Brand Commitments

- Name: ProofMart.
- Honesty is the brand. No invented customers, logos, testimonials, metrics, certifications (SOC 2, ISO), SLAs, or integrations. Synthetic data is labelled SAMPLE wherever a visitor could mistake it for real.
- The Evidence Rail (live, in-browser, findings pinned to the sample statement, clicking a finding turns to its page and row) stays the central demonstration.
- India-first: it should feel at home for Indian lenders and fintechs (INR, Indian bank statements, Razorpay).
- Copy is plain and specific; no generic startup language.

## Evidence on Hand

- The real engine, real API, real CLI, real signed dossiers, and the bundled sample statement with its four real findings (`web/src/components/evidence-rail/sample-statement.ts`).
- Absent and not to be fabricated: customers, usage numbers, accuracy/recall figures, latency benchmarks, compliance certifications, uptime.

## Product Principles

1. Show the evidence, not a score: every surface should let someone point at the row.
2. Deterministic and reproducible beats impressive; never imply intelligence the engine doesn't have.
3. The developer path (see a document → see the verdict → inspect the evidence → run the API → integrate) is first-class, not a footer.
4. The reviewer must be able to defend a decision from what the report shows alone.
