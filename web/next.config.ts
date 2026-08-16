import type { NextConfig } from "next";

// Extra origins the *browser* genuinely needs to talk to beyond this app's
// own domain: the presigned direct-to-Blob upload PUT (see
// upload-token/route.ts and use-live-document.ts's submitViaBlob) goes
// straight from the browser to Vercel Blob's storage host, never through
// this server. Supabase's own project URL is included too even though no
// Client Component currently imports lib/supabase/client.ts — cheap to
// allow now rather than a silent CSP break the day something does.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const isDev = process.env.NODE_ENV === "development";

// No nonces here on purpose: this app renders styling via inline
// `style={{...}}` throughout (not a nonce-friendly CSS-in-JS setup), and
// Next.js's own RSC streaming bootstrap injects small inline <script>
// blocks on every page — a nonce-based `script-src`/`style-src` would
// require rearchitecting both of those just to add CSP, and would force
// every route into dynamic rendering (no static optimization for
// robots.txt/sitemap.xml, no ISR). `'unsafe-inline'` is a real, known
// trade-off, not an oversight — grep confirms zero
// `dangerouslySetInnerHTML` and zero externally-loaded scripts/styles
// anywhere in this app, which is what actually matters for this app's XSS
// exposure: nothing here ever injects raw, attacker-controlled markup.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' https://*.blob.vercel-storage.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .concat(";");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

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
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
