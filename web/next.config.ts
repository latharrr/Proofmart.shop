import type { NextConfig } from "next";

// `npm run build` uses the Turbopack default (plain `next build`), not
// `--webpack`. An earlier version of this file forced `--webpack` because
// @firecrawl/pdf-inspector's native binding failed to load during Vercel's
// build-time "Collecting page data" step. That was a misdiagnosis: the real
// cause was @firecrawl/pdf-inspector@1.14.2's binary requiring a newer
// glibc than Vercel's build image provides (see the `dependencies` pin on
// 1.12.0 in package.json) — switching bundlers only appeared to fix it
// because it was tested on a different commit at the same time the glibc
// issue was separately present. Forcing `--webpack` has its own real cost:
// it silently produces a plain static-file build with no serverless
// functions wired up (Vercel's Next.js builder no longer recognizes the
// output), so `/api/inspect` 404s in production. Confirmed fixed by
// reverting to Turbopack once the glibc pin (1.12.0) was in place — the
// build succeeds, `/api/inspect` and `/api/upload-token` are correctly
// detected as serverless functions, and outputFileTracingIncludes below
// still traces every OCR asset correctly under Turbopack.
const nextConfig: NextConfig = {
  // Native/multi-file packages that must stay on disk as real files and be
  // loaded via Node's require, not bundled into a single webpack/turbopack
  // chunk: @firecrawl/pdf-inspector is a native (napi-rs) module;
  // tesseract.js spawns a worker_threads.Worker from a literal file path in
  // its own package, and tesseract.js-core's emscripten glue code loads
  // real .wasm files relative to its own location — bundling either would
  // silently break those file-path assumptions.
  serverExternalPackages: ["@firecrawl/pdf-inspector", "tesseract.js", "tesseract.js-core"],
  // Belt-and-suspenders alongside serverExternalPackages: guarantees the
  // OCR route's deployed function actually contains the Tesseract.js worker
  // script, every WASM core variant (the SIMD-capable one is chosen at
  // runtime, not build time — see getCore.js), and this repo's own bundled
  // English trained data. None of these are reachable via a static
  // require()/import() Next's own tracer can follow on its own: the worker
  // script is loaded by path at runtime (worker_threads.Worker), and the
  // trained-data path is built from a runtime string, not a source literal.
  outputFileTracingIncludes: {
    "/api/inspect": ["node_modules/tesseract.js/src/worker-script/**/*", "node_modules/tesseract.js-core/**/*", "src/lib/ocr/tessdata/**/*"],
  },
};

export default nextConfig;
