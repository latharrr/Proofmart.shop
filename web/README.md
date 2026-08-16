# ProofMart

Document forensics as a structured evidence graph — upload a PDF, get real extracted facts and real deterministic verification findings, each pinned to its coordinates on the page.

**What this is today:** a working upload → classify → extract → OCR (when needed) → verify → Evidence Rail pipeline, returning real JSON. **What it is not (yet):** signed output, a generated PDF dossier, webhook delivery, a CLI, or a public documented API — see [What's not built yet](#whats-not-built-yet).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Uploading a PDF works out of the box in local dev — no environment variables are required for the core flow (upload → inspect → extract → verify → Evidence Rail).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | No (recommended in production) | Enables direct browser → [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) uploads via `/api/upload-token`, bypassing the platform's serverless request-body size limit (~4.5 MB) for larger PDFs. Set automatically when a Blob store is attached to the Vercel project — **the store must be created as Private**, see [Blob storage is private](#blob-storage-is-private). Without it, uploads fall back to posting the file directly to `/api/inspect` — this works for files under the body-size limit and is exactly how local dev runs. |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Only if `BLOB_READ_WRITE_TOKEN` is set | Required for `/api/upload-token`'s presigned-upload flow to function at all. Set alongside `BLOB_READ_WRITE_TOKEN` by the standard "Connect to Project" flow. |

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

### Running Playwright locally

`playwright.config.ts` and two unit tests (`tests/unit/ocr.test.ts`, `tests/unit/ocr-tesseract-js.test.ts`) hardcode `executablePath: "/opt/pw-browsers/chromium"` — a pre-installed Chromium path specific to the sandbox this project was originally developed in. On a machine without a browser at that exact path (most machines), `npm run test:e2e` and the two OCR tests that render a fixture via a real browser will fail with `browserType.launch: Failed to launch chromium because executable doesn't exist at /opt/pw-browsers/chromium` — that's an environment gap, not a code defect; every other unit test is unaffected. To run them locally: `npx playwright install chromium`, find the installed binary under `~/Library/Caches/ms-playwright/` (macOS) or the platform equivalent, and temporarily point the three hardcoded paths at it. Don't commit that change — revert before pushing, so CI/deployment environments that do have the sandbox path keep working.

## Architecture

```
Uploaded PDF
  → lib/pdf/inspect.ts    (validate, classify — @firecrawl/pdf-inspector)
  → lib/pdf/extract.ts    (positioned text, markdown — PDFProcessor)
  → OCR (Tesseract.js, only on pages pdf-inspector flags as needing it)
  → lib/pdf/normalize.ts  (raw extraction → ProcessedDocument + ExtractedFact[])
  → lib/verification/     (Marker registry → VerificationFinding[] → Verdict)
  → Evidence Rail          (real coordinates, real verdict, real evidence)
```

### Verification markers

Six markers are registered in `lib/verification/registry.ts` and actually run. The homepage's marker catalog (`lib/home-data.ts`'s `MARKERS`) must always mirror this list exactly — it did drift once (advertised three markers that were never implemented and silently omitted three real ones); if you add or remove a marker here, update that file too.

| Marker | Category | Verdict on hit |
|---|---|---|
| `BALANCE_BREAK` | Arithmetic | FAIL |
| `CROSS_PAGE_TOTAL_MISMATCH` | Arithmetic | FAIL |
| `DATE_SEQUENCE_ANOMALY` | Semantic | REVIEW |
| `DUPLICATE_TRANSACTION` | Semantic | REVIEW |
| `OCR_LOW_CONFIDENCE` | Extraction | REVIEW |
| `ENCODING_ANOMALY` | Extraction | REVIEW |

Markers considered and deliberately **not** implemented (`PRODUCER_MISMATCH`, `FONT_METRIC_SHIFT`, column-inconsistency) are documented with reasons at the top of `registry.ts` — the evidence they'd need doesn't exist in the current pipeline, so nothing fabricates a substitute.

Verdict precedence is fixed and explainable, no scoring model: a document is `INCONCLUSIVE` if zero markers had sufficient evidence to run at all, `FAIL` if any finding is FAIL, else `REVIEW` if any finding is REVIEW, else `CLEAR`. See `lib/verification/verdict.ts`.

### pdf-inspector version pin (important)

`@firecrawl/pdf-inspector` is pinned to an exact `1.12.0` — **do not bump it without re-verifying a real Vercel deployment.** From 1.13.0 onward the package's prebuilt Linux binaries are compiled against `GLIBC_2.35`, which is newer than Vercel's build/runtime image provides, so the native module fails to load with `ERR_DLOPEN_FAILED: version 'GLIBC_2.35' not found` and the build dies at "Collecting page data". Verified by reading the binaries' own ELF symbol versions (`readelf -V`): 1.12.0 tops out at `GLIBC_2.34`, 1.13.0+ requires 2.35. Changing the Node.js version in Vercel project settings does not help — the glibc floor belongs to the build image, not the Node runtime.

Two capabilities are given up by this pin, both handled explicitly rather than silently:

- **Heading facts.** Deriving them needs `extractStructureElements` (the PDF's own tagged H1–H6 roles), added in 1.14.0. Nothing substitutes for it — guessing headings from font size or markdown `#` prefixes would be a weaker signal presented under the same name. The `heading` fact kind remains defined and becomes live again if the pin is lifted.
- **Measured text-run widths.** 1.12.0 returns `width: 0` for every glyph-derived text run (`x`, `y`, `height`, `fontSize`, and text are all still exact). Left alone this collapses every evidence highlight to an invisible zero-width sliver. `textItemWidth` in `lib/pdf/normalize.ts` therefore estimates a width from the exact font size and character count **only when the real width is absent** — a real width always wins, so this self-heals on a future upgrade. The estimate sizes a *highlight box* only; it never enters a finding's evidence, and every finding's page, coordinates, and arithmetic remain exactly what the document reports. Link and form-field rects come from the PDF's own `/Annots` geometry and carry real widths, so they are unaffected.

## Deploying on Vercel

1. Import the repo into a new Vercel project. **Set Root Directory to `web`** (this Next.js app is not at the repo root — `chats/` and `project/` are siblings).
2. **Set Framework Preset to Next.js explicitly.** Left unset, a real outage was traced to this: `vercel build` ran `npm run build` successfully (`next build` genuinely compiled and reported the correct route table) but with no framework recognized, Vercel didn't translate the `.next` output into servable functions/routes at all — `Deploying outputs...` completed in about a second (far too fast for a real Next.js app with two serverless functions and several MB of OCR assets), and every single route, including the deployment's own unique per-deploy URL, returned a platform-level `NOT_FOUND`, with zero runtime errors logged (because no request ever reached the function). The build log looking completely clean is exactly what makes this one easy to miss — check `framework` on the project (not just that the build "passed") if a fresh deploy 404s everywhere.
3. **Turn off Vercel Authentication (Project Settings → Deployment Protection → Vercel Authentication)** unless you specifically want every visitor gated behind a Vercel login — it defaults to blocking `*.vercel.app` URLs entirely, which looks identical to "nothing deployed" from the outside.
4. Attach a Vercel Blob store to the project (Storage tab) to get large-file uploads — optional, see above, but **if you do, create it as Private, not Public** (see [Blob storage is private](#blob-storage-is-private)) and use the "Connect to Project" flow so `BLOB_WEBHOOK_PUBLIC_KEY` gets set alongside `BLOB_READ_WRITE_TOKEN`. OCR needs no setup of its own; every asset it uses is already in the deployment.
5. Deploy. `/api/inspect` and `/api/upload-token` run on the Node.js runtime (required — `@firecrawl/pdf-inspector` is a native module and cannot run on Edge). `npm run build` uses the Turbopack default. **Do not add a `--webpack` flag to the build command** — it was tried as a (mis-diagnosed) fix for the glibc issue above, but it makes Vercel's Next.js builder stop recognizing serverless functions entirely, so `/api/inspect` 404s in production. See the comment at the top of `next.config.ts`.
6. After deploying, sanity-check the live URL isn't just serving a cached/unrelated response: `curl -s -o /dev/null -w "%{http_code}" <url>/api/upload-token` should return `200` with `{"available": ...}`, not `404`.

## What's not built yet

The marketing page (`src/components/home/*`) once advertised several of these as live capabilities; that copy has since been corrected to say "planned," not shipped. Listing them here too so this doesn't quietly drift again:

- **Signing.** No response is cryptographically signed. No `ed25519`/crypto-signing dependency exists in `package.json`.
- **PDF dossier generation.** The API returns JSON only (`{ document, verification }`). No code generates a PDF report from a scan.
- **Webhook delivery.** No callback/queue system exists.
- **CLI.** No terminal client ships from this repo.
- **Public versioned API.** `/api/inspect` is the same internal route the web UI itself calls — unauthenticated, unrate-limited, undocumented as a product surface. There is no `/v1/analyze` or equivalent.
- **Auth / billing.** "Sign in" and "Get access" are anchors with no backend.

`robots.ts` and `sitemap.ts` (Next.js metadata route conventions) exist at `src/app/` — `/robots.txt` and `/sitemap.xml` are real, served routes, not TODOs.

### Blob storage is private

Uploaded PDFs go through Vercel Blob's presigned-upload flow (`handleUploadPresigned`/`uploadPresigned`, not `handleUpload`/`upload()` — see `upload-token/route.ts`'s and `upload-safety.ts`'s comments for why the two aren't interchangeable here). `/api/inspect` reads the blob back with the server's own `get(url, { access: "private" })`, authenticated via `BLOB_READ_WRITE_TOKEN`/OIDC, and deletes it in a `finally` block immediately after processing, win or fail.

**Private vs. public is a property of the Blob *store* itself**, chosen once when the store is created in the Vercel dashboard (Storage tab → Create Database → Blob → **Private**) — not a per-upload code setting. This project's Blob store must be created as Private for any of the above to actually mean anything; a Public store would make uploaded documents (real financial statements) reachable by anyone who obtains the URL during the upload→process window, no matter what `access` value the code passes. See `.env.example` for the exact env vars required (`BLOB_READ_WRITE_TOKEN` or OIDC, plus `BLOB_WEBHOOK_PUBLIC_KEY`, which `handleUploadPresigned` requires unconditionally even though this app doesn't use upload-completion webhooks).
