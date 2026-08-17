import type { NextConfig } from "next";

// Extra origins the *browser* genuinely needs to talk to beyond this app's
// own domain: the presigned direct-to-Blob upload PUT (see
// upload-token/route.ts and use-live-document.ts's submitViaBlob) goes
// straight from the browser to Vercel Blob. `@vercel/blob`'s client
// `uploadPresigned`/`upload()` (confirmed on the installed 2.8.0 by reading
// `getApiUrl()` in its own dist/chunk-*.js) actually PUTs to
// `https://vercel.com/api/blob` — a delegation-token proxy endpoint, not
// the `*.blob.vercel-storage.com` storage host directly — so that origin
// has to be allowed too, or the browser's own CSP silently blocks every
// upload (`connect-src` violation) and the UI hangs at "EXTRACTING…"
// forever with no console error surfaced to a casual glance. Reproduced
// live against production before adding this. Supabase's own project URL
// is included too even though no Client Component currently imports
// lib/supabase/client.ts — cheap to allow now rather than a silent CSP
// break the day something does.
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
  // https://checkout.razorpay.com/v1/checkout.js is loaded on /account/billing
  // only (see create-checkout-button.tsx) to open Razorpay's own hosted
  // checkout — allowed globally here for the same reason 'unsafe-inline'
  // already is: a nonce-based CSP isn't compatible with this app's
  // inline-style/no-CSS-in-JS architecture (see comment above), so a
  // per-route CSP isn't practical either.
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' https://*.blob.vercel-storage.com https://vercel.com https://api.razorpay.com https://lumberjack.razorpay.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  // Razorpay's checkout renders inside an iframe it injects itself.
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
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
  poweredByHeader: false,
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
  //
  // The glob covers all of tesseract.js's `src/` (196KB, not just
  // `src/worker-script/`) because the worker thread's own files reach
  // outside that directory via relative require()s Next's tracer can't
  // follow either — e.g. worker-script/utils/dump.js requires
  // `../../constants/imageType` (src/constants/imageType.js) and
  // worker-script/node/getCore.js requires `../../constants/OEM`
  // (src/constants/OEM.js). A `worker-script/**/*`-only glob (this file's
  // prior version) shipped a function missing src/constants entirely:
  // confirmed live in production as `Uncaught Exception: Error: Cannot
  // find module '../../constants/imageType'`, which crashed the worker's
  // Node process (exit 129) on every OCR attempt — the app's own
  // fail-fast guard in ocr/tesseract-js.ts caught it and degraded to
  // "OCR needed" with no extracted text rather than hanging, but OCR
  // itself never actually ran.
  outputFileTracingIncludes: {
    "/api/inspect": ["node_modules/tesseract.js/src/**/*", "node_modules/tesseract.js-core/**/*", "src/lib/ocr/tessdata/**/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
