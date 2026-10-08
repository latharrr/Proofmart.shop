# ProofMart

Document forensics as a structured evidence graph. Upload a PDF and get extracted facts plus deterministic verification findings, each pinned to its coordinates on the page.

Live: https://proofmart-shop.vercel.app

## What it does

Upload, classify, extract, OCR (only when a page needs it), verify, then show the result in an Evidence Rail. Signed-in users get their results saved and retrievable. There is also a public API and signed verification dossiers.

```
Uploaded PDF
  -> classify         (@firecrawl/pdf-inspector)
  -> extract          (positioned text, markdown)
  -> OCR              (Tesseract.js, only on pages that need it)
  -> normalize        (ProcessedDocument + ExtractedFact[])
  -> verify           (marker registry -> findings -> verdict)
  -> Evidence Rail    (real coordinates, real verdict, real evidence)
```

### Verification markers

Six markers are registered and run:

| Marker | Category | Verdict on hit |
|---|---|---|
| `BALANCE_BREAK` | Arithmetic | FAIL |
| `CROSS_PAGE_TOTAL_MISMATCH` | Arithmetic | FAIL |
| `DATE_SEQUENCE_ANOMALY` | Semantic | REVIEW |
| `DUPLICATE_TRANSACTION` | Semantic | REVIEW |
| `OCR_LOW_CONFIDENCE` | Extraction | REVIEW |
| `ENCODING_ANOMALY` | Extraction | REVIEW |

Verdicts follow a fixed order, with no scoring model: `INCONCLUSIVE` if no marker had enough evidence to run, `FAIL` if any finding is FAIL, else `REVIEW` if any finding is REVIEW, else `CLEAR`.

### Public API

`POST /v1/inspect`, `POST /v1/extract` and `POST /v1/verify` take `multipart/form-data` with a `file` field. They are three depths of one engine. Keys are created at `/account/api-keys`. Only a hash of each key is stored.

## Stack

Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (auth, database, row-level security), Vercel Blob, pdf-lib, pdfjs-dist, Tesseract.js, Razorpay (billing scaffold), Vitest and Playwright.

## Repo layout

The app lives in [`web/`](web/). Start with [`web/README.md`](web/README.md) for setup, environment variables, auth, the API, Vercel deployment and known limits. `chats/` and `project/` hold the original design handoff files.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. Uploading a PDF works locally with no environment variables. Sign-in needs the Supabase variables listed in `web/.env.example`.

```bash
npm run test:unit   # Vitest
npm run test:e2e    # Playwright
```

## Status

Live payments have not been tested against a real Razorpay account. See "What's not built yet" in `web/README.md`.

## Author

Deepanshu Lathar - https://deepanshulathar.com - [@latharrr](https://github.com/latharrr)
