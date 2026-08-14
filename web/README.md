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

Scanned/image pages are OCR'd via [Tesseract.js](https://github.com/naptha/tesseract.js) (`lib/ocr/tesseract-js.ts`), running in-process on Node's `worker_threads` — **no system binary, no API key, no CDN, no network call of any kind at recognition time.** Every asset it needs is bundled directly in this repo/deployment:

| Asset | Source |
|---|---|
| Worker script | `node_modules/tesseract.js/src/worker-script/node/index.js` (npm package) |
| WASM core (all SIMD variants) | `node_modules/tesseract.js-core/*.wasm` (npm package) |
| English trained data | `src/lib/ocr/tessdata/eng.traineddata.gz` (vendored in this repo, ~2.9 MB) |

`next.config.ts` marks `tesseract.js`/`tesseract.js-core` as `serverExternalPackages` (so their multi-file structure survives bundling intact) and lists all three asset locations under `outputFileTracingIncludes` for the `/api/inspect` route, so Vercel's build always ships them with the deployed function — verified after `npm run build` by inspecting `.next/server/app/api/inspect/route.js.nft.json`. This works unmodified on Vercel's default Node.js serverless runtime; no extra configuration or environment variable is needed.

A `TesseractJsOcrProcessor` instance is created fresh per upload request (see `/api/inspect/route.ts`) and backs exactly one processing job: its worker thread spins up lazily on the first OCR-needing page, is reused for every other page in that same document, and is torn down via `terminate()` once the document is done (`PDFProcessor.applyOcr`'s `finally` block). A missing or corrupted local asset fails fast with a clear error (checked before ever spawning a worker) rather than hanging or fabricating OCR text — Tesseract.js 7.0.0 has a real defect where its own Node worker error handling can otherwise hang indefinitely on an init failure, so this processor doesn't rely on it.

An alternative implementation, `lib/ocr/tesseract-cli-processor.ts`, shells out to a system `tesseract` binary instead — not wired into `/api/inspect` by default, but available for self-hosted/Docker deployments that have the binary installed and prefer its (generally faster) native performance.

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
2. Attach a Vercel Blob store to the project (Storage tab) to get large-file uploads — optional, see above. OCR needs no setup of its own; every asset it uses is already in the deployment.
3. Deploy. `/api/inspect` and `/api/upload-token` run on the Node.js runtime (required — `@firecrawl/pdf-inspector` is a native module and cannot run on Edge).

### Blob access level (known limitation)

Uploaded PDFs currently go through Vercel Blob with `access: "public"` — reachable by anyone with the URL for the short window between upload and processing (the URL itself is unguessable, `addRandomSuffix: true`, and the blob is deleted in `/api/inspect`'s `finally` block immediately after processing, win or fail). The installed `@vercel/blob` SDK (2.8.0) does support `access: "private"` in general, but **not** through the client-token upload flow this app uses (`handleUpload`/`upload()`) — its `onBeforeGenerateToken` return type has no `access` field, so a client-token blob is always public regardless of what's requested. True private access requires migrating to the SDK's separate presigned-URL flow (`handleUploadPresigned`/`presignPutUrl`), which is a different upload mechanism, not a drop-in config change — out of scope for this pass.
