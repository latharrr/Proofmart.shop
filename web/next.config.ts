import type { NextConfig } from "next";

// `npm run build` runs `next build --webpack` (see package.json), not the
// Turbopack default. This is a real, verified workaround, not a stylistic
// choice: under Turbopack, Next's build-time "Collecting page data" step
// fails to load @firecrawl/pdf-inspector's native binding for
// `/api/inspect` — reproduced against a real deployment build — even
// though the exact same code, same node_modules, and same platform work
// correctly both in `next dev` and at actual request-serving runtime under
// `next start`. `next build --webpack` was confirmed clean end-to-end
// (build succeeds, the native binding loads, a real HTTP request against
// the built server correctly extracts text AND runs OCR). `next dev` is
// left on Turbopack — the failure is specific to the build-time page-data
// collection step, which dev mode doesn't run the same way.
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
