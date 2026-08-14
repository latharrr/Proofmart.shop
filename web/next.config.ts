import type { NextConfig } from "next";

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
