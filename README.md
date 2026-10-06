# ProofMart

Document forensics as an API. Upload a PDF, get back a structured report of
findings — each one pinned to a pixel coordinate box on the page, each one
showing the arithmetic it used — and a single `FAIL` / `REVIEW` / `CLEAR`
verdict.

The point is that every claim is checkable. A finding is not a score or a
confidence percentage; it is a rule with a citation, and the citation is a
page, a row and a box you can screenshot.

Delivered four ways, all running the same engine: web upload, the `/v1/verify`
API, HMAC-signed webhooks, and a CLI.

---

## Repository layout

```
web/     the Next.js application — app, public API, verification engine
cli/     `proofmart` command-line client (thin wrapper over the public API)
project/ original Claude Design HTML prototypes — historical, not built from
chats/   the design conversation that produced them — historical
```

`project/` and `chats/` are the design handoff bundle this repo started from.
They are kept for provenance. **The application has since been built; do not
treat those prototypes as the spec.** The marketing page's current design
system lives in `design-system.md` and `bar.md` at the repo root.

---

## Getting it running

```bash
cd web
npm install
cp .env.example .env.local     # then fill in, see below
npm run dev                    # http://localhost:3000
```

The app degrades rather than crashes when optional services are missing: with
no environment at all it still boots, the home page renders, and the Evidence
Rail runs its bundled sample document entirely in the browser. Sign-in,
persistence, the public API, billing and dossier signing each switch off
independently.

### Environment

`web/.env.example` is the reference — it documents every variable, what breaks
without it, and where to get it. The short version:

| Needed for | Variables |
|---|---|
| Auth, database, anything persisted | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| The public `/v1/*` API | `SUPABASE_SERVICE_ROLE_KEY` |
| PDFs above the ~4.5MB serverless body limit | `BLOB_READ_WRITE_TOKEN` (or `BLOB_STORE_ID` + OIDC), `BLOB_WEBHOOK_PUBLIC_KEY` |
| Signed PDF dossiers | `PROOFMART_SIGNING_PRIVATE_KEY_B64`, `PROOFMART_SIGNING_PUBLIC_KEY_B64` |
| Webhook retry sweep | `CRON_SECRET` |
| Billing | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| OCR backend (optional) | `OCR_PROCESSOR` |

### Database

The schema is in `web/supabase/migrations/`, numbered and meant to be applied
in order. Apply them to a new Supabase project with the Supabase CLI, or by
pasting each file into the SQL editor in filename order. Every file is
re-runnable.

Row Level Security is on for every table and is **load-bearing, not
decorative** — the public API, the dossier signer and the webhook dispatcher
each deliberately use a different Postgres role, and the policies are what keep
one user's documents, API keys and webhook secrets away from another's.
`web/tests/unit/rls-cross-tenant.test.ts` is the executable specification for
that: it signs in as two real users and asserts each one is blind to the
other's rows. Read it before changing a policy.

---

## Scripts

Run from `web/`:

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest — engine, markers, adapters, RLS |
| `npm run test:e2e` | Playwright — real PDFs through the real pipeline |

`npx tsc --noEmit` for a type check on its own.

The end-to-end tests are not mocked: they push real PDF fixtures through the
real verification engine and assert on the findings that come out. That is
deliberate — a forensics product whose tests stub out the forensics is testing
nothing.

From `cli/`: `node --test`.

---

## How a verification works

```
PDF bytes
  │
  ├─ inspect    pdfType, page count, whether a text layer exists   lib/pdf/inspect.ts
  ├─ extract    text runs with sub-pixel coordinates               lib/pdf/extract.ts
  │             (OCR fallback when there is no usable text layer)  lib/ocr/
  ├─ reconstruct tables inferred from column occupancy, not ruled
  │             lines                                              lib/verification/table-reconstruction.ts
  ├─ markers    each rule runs over the run graph and emits
  │             findings with coordinates                          lib/verification/markers/
  └─ verdict    fixed precedence: FAIL beats REVIEW beats CLEAR    lib/verification/verdict.ts
```

There is no model in that path. No LLM, no classifier, no learned scoring — the
markers are deterministic rules over extracted geometry and arithmetic, which
is what makes a finding explainable and a verdict reproducible. The same bytes
always produce the same verdict, and `VERIFICATION_ENGINE_VERSION` records
which version of the rules produced a stored one.

**The six markers that exist today** are the whole catalogue —
`lib/verification/registry.ts` is the source of truth, and the marketing page's
list mirrors it exactly rather than advertising rules that are not implemented:

`BALANCE_BREAK`, `CROSS_PAGE_TOTAL_MISMATCH` (arithmetic, `FAIL`) ·
`DATE_SEQUENCE_ANOMALY`, `DUPLICATE_TRANSACTION` (semantic, `REVIEW`) ·
`OCR_LOW_CONFIDENCE`, `ENCODING_ANOMALY` (extraction, `REVIEW`)

---

## Surfaces

**Public API** (API key, `Authorization: Bearer pm_live_…`)

| Route | |
|---|---|
| `POST /v1/verify` | PDF in, full finding graph and verdict out |
| `POST /v1/inspect` | Structural inspection only |
| `POST /v1/extract` | Text runs with coordinates |
| `GET /v1/documents`, `/v1/documents/:id`, `/v1/documents/:id/result` | Saved verification history |
| `POST /v1/verify-signature` | Check a dossier signature — **no auth required**, anyone holding a dossier can verify it |

**Webhooks.** Register an endpoint, and every completed verification delivers an
HMAC-signed `verification.completed` / `verification.failed` callback. A failing
delivery is attempted six times in all — the immediate one plus five retries at
1, 5, 30, 120 and 720 minutes, so roughly half a day before it is marked
exhausted (`lib/webhooks/deliver.ts`); a Vercel Cron
job hits `/api/webhooks/sweep` daily to drive the retries and prune expired
bookkeeping rows.

**Dossiers.** A saved verification can be exported as a PDF signed with Ed25519.
The signature covers a canonicalized payload including the sha256 of the exact
bytes verified, so a recipient can confirm both origin and that nothing was
edited afterwards — and can check it without an account.

**CLI.** `proofmart verify|inspect|extract|list|get`. It calls the public API and
does no document processing of its own.

---

## Security notes

- A CSP is set in `web/next.config.ts`. `font-src` is `'self'` only, so fonts
  must be self-hosted via `next/font` — a `<link>` to a font CDN is blocked by
  the browser and the page silently falls back.
- API keys are stored only as a sha256 hash; the raw key is shown once at
  creation and never persisted or logged.
- Webhook target URLs are re-resolved and re-checked before every delivery
  attempt (`lib/webhooks/url-safety.ts`) so a hostname cannot be re-pointed at
  an internal address between registration and delivery.
- The service role key bypasses RLS entirely. It is used only in server-side
  paths that genuinely have no user session — API-key authentication, webhook
  dispatch, the retry sweep, public signature verification — and never reaches
  the browser.

## Known open items

- **Pricing is a placeholder.** `lib/billing/plans.ts` says so in the file. The
  Razorpay integration, checkout, webhook and quota enforcement are real and
  work; the numbers are not a business decision anyone has made yet.
- The marker catalogue is six rules. That is a real limit, not a roadmap
  omission — anything added to the product's claims has to be added to
  `registry.ts` first.
