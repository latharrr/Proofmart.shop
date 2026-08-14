# ProofMart

Document forensics as a signed evidence graph — upload a PDF, get real extracted facts and real deterministic verification findings, each pinned to its coordinates on the page.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Uploading a PDF works out of the box in local dev — no environment variables are required for the core flow (upload → inspect → extract → verify → Evidence Rail).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | No (recommended in production) | Enables direct browser → [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) uploads via `/api/upload-token`, bypassing the platform's serverless request-body size limit (~4.5 MB) for larger PDFs. Set automatically when a Blob store is attached to the Vercel project. Without it, uploads fall back to posting the file directly to `/api/inspect` — this works for files under the body-size limit and is exactly how local dev runs. |

No other secrets are required. The document-processing pipeline (`@firecrawl/pdf-inspector`, `pdfjs-dist`, `pdf-lib`) runs entirely locally — no external API keys.

### OCR

Scanned/image pages are OCR'd locally via the system `tesseract` binary (`lib/ocr/tesseract-cli-processor.ts`) — no API key, no network call. This requires `tesseract` to be present on `PATH` (`apt-get install tesseract-ocr` on Debian/Ubuntu); **Vercel's default serverless runtime does not include it**. When the binary isn't available, OCR is skipped cleanly — pages that needed it simply produce no `ocr-text` facts, and everything else (extraction, verification) still runs. To get real OCR in production, deploy to a runtime that bundles the binary (e.g. a Docker-based Vercel build with `tesseract-ocr` installed, or a self-hosted Node server).

## Scripts

```bash
npm run dev         # dev server
npm run build        # production build
npm run start         # run the production build
npm run lint          # eslint
npm run test:unit     # vitest — unit tests
npm run test:e2e      # playwright — browser tests (starts its own prod server on :3100)
```

## Architecture

```
Uploaded PDF
  → lib/pdf/inspect.ts    (validate, classify — @firecrawl/pdf-inspector)
  → lib/pdf/extract.ts    (positioned text, markdown, structure — PDFProcessor)
  → lib/pdf/normalize.ts  (raw extraction → ProcessedDocument + ExtractedFact[])
  → lib/verification/     (Marker registry → VerificationFinding[] → Verdict)
  → Evidence Rail          (real coordinates, real verdict, real evidence)
```

See `lib/verification/registry.ts` for the implemented markers and the ones deliberately not implemented (with reasons).

## Deploying on Vercel

1. Import the repo into a new Vercel project (root: this `web/` directory if the repo has siblings).
2. Attach a Vercel Blob store to the project (Storage tab) to get large-file uploads — optional, see above.
3. Deploy. `/api/inspect` and `/api/upload-token` run on the Node.js runtime (required — `@firecrawl/pdf-inspector` is a native module and cannot run on Edge).
