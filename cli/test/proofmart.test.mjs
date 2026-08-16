import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, run, summarize, DEFAULT_BASE_URL, VERSION } from "../bin/proofmart.mjs";

test("parseArgs: positional args and flags", () => {
  const args = parseArgs(["verify", "file.pdf", "--json", "--api-key", "pm_live_x", "--output", "out.json"]);
  assert.deepEqual(args._, ["verify", "file.pdf"]);
  assert.equal(args.json, true);
  assert.equal(args.apiKey, "pm_live_x");
  assert.equal(args.output, "out.json");
});

test("parseArgs: -h/-v shorthand", () => {
  assert.equal(parseArgs(["-h"]).help, true);
  assert.equal(parseArgs(["-v"]).version, true);
});

test("summarize: verify formats verdict and findings", () => {
  const out = summarize("verify", { verdict: "FAIL", findings: [{ verdict: "FAIL", markerId: "BALANCE_BREAK", evidence: { summary: "off by 10" } }] });
  assert.match(out, /verdict:\s+FAIL/);
  assert.match(out, /BALANCE_BREAK — off by 10/);
});

test("summarize: inspect formats classification", () => {
  const out = summarize("inspect", { classification: { pdfType: "TextBased", pageCount: 3, confidence: 0.9 } });
  assert.match(out, /type:\s+TextBased/);
  assert.match(out, /pages:\s+3/);
});

test("run: no args prints help and exits 0", async () => {
  let logged = "";
  const code = await run([], { log: (s) => (logged += s) });
  assert.equal(code, 0);
  assert.match(logged, /Usage:/);
});

test("run: --version prints the version and exits 0", async () => {
  let logged = "";
  const code = await run(["--version"], { log: (s) => (logged += s) });
  assert.equal(code, 0);
  assert.equal(logged, VERSION);
});

test("run: unknown command exits 1", async () => {
  const code = await run(["frobnicate", "file.pdf"], { log: () => {}, logError: () => {} });
  assert.equal(code, 1);
});

test("run: missing file argument exits 1", async () => {
  const code = await run(["verify"], { log: () => {}, logError: () => {} });
  assert.equal(code, 1);
});

test("run: missing API key exits 1 with a clear message", async () => {
  const originalKey = process.env.PROOFMART_API_KEY;
  delete process.env.PROOFMART_API_KEY;
  try {
    let error = "";
    const code = await run(["verify", "file.pdf"], { logError: (s) => (error += s), log: () => {} });
    assert.equal(code, 1);
    assert.match(error, /No API key/);
  } finally {
    if (originalKey) process.env.PROOFMART_API_KEY = originalKey;
  }
});

test("run: unreadable file exits 1 without ever attempting a network call", async () => {
  let fetchCalled = false;
  const code = await run(["verify", "missing.pdf", "--api-key", "pm_live_x"], {
    readFileImpl: async () => {
      throw new Error("ENOENT: no such file");
    },
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("should not be called");
    },
    log: () => {},
    logError: () => {},
  });
  assert.equal(code, 1);
  assert.equal(fetchCalled, false);
});

test("run: verify success — posts multipart to the right URL with the Bearer header, prints a summary, exits 0", async () => {
  let capturedUrl, capturedInit;
  const fetchImpl = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(JSON.stringify({ verdict: "CLEAR", findings: [] }), { status: 200 });
  };
  let logged = "";
  const code = await run(["verify", "file.pdf", "--api-key", "pm_live_x", "--base-url", "https://example.test"], {
    readFileImpl: async () => Buffer.from("%PDF-1.4 fake"),
    fetchImpl,
    log: (s) => (logged += s),
    logError: () => {},
  });
  assert.equal(code, 0);
  assert.equal(capturedUrl, "https://example.test/v1/verify");
  assert.equal(capturedInit.headers.Authorization, "Bearer pm_live_x");
  assert.ok(capturedInit.body instanceof FormData);
  assert.match(logged, /verdict:\s+CLEAR/);
});

test("run: --json prints the raw response instead of a summary", async () => {
  const body = { verdict: "REVIEW", findings: [{ verdict: "REVIEW" }] };
  let logged = "";
  const code = await run(["verify", "file.pdf", "--api-key", "pm_live_x", "--json"], {
    readFileImpl: async () => Buffer.from("x"),
    fetchImpl: async () => new Response(JSON.stringify(body), { status: 200 }),
    log: (s) => (logged += s),
    logError: () => {},
  });
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(logged), body);
});

test("run: --output writes the JSON response to a file", async () => {
  const body = { verdict: "CLEAR", findings: [] };
  let written = null;
  const code = await run(["verify", "file.pdf", "--api-key", "pm_live_x", "--output", "out.json"], {
    readFileImpl: async () => Buffer.from("x"),
    fetchImpl: async () => new Response(JSON.stringify(body), { status: 200 }),
    writeFileImpl: async (path, contents) => {
      written = { path, contents };
    },
    log: () => {},
    logError: () => {},
  });
  assert.equal(code, 0);
  assert.equal(written.path, "out.json");
  assert.deepEqual(JSON.parse(written.contents), body);
});

test("run: a non-2xx API response (e.g. revoked key) exits 1 and reports the error code", async () => {
  const body = { error: { code: "revoked_api_key", message: "This API key has been revoked." } };
  let error = "";
  const code = await run(["verify", "file.pdf", "--api-key", "pm_live_x"], {
    readFileImpl: async () => Buffer.from("x"),
    fetchImpl: async () => new Response(JSON.stringify(body), { status: 401 }),
    log: () => {},
    logError: (s) => (error += s),
  });
  assert.equal(code, 1);
  assert.match(error, /revoked_api_key/);
});

test("run: a network failure exits 1 without throwing", async () => {
  const code = await run(["verify", "file.pdf", "--api-key", "pm_live_x"], {
    readFileImpl: async () => Buffer.from("x"),
    fetchImpl: async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    },
    log: () => {},
    logError: () => {},
  });
  assert.equal(code, 1);
});

test("run: defaults to the real ProofMart domain when --base-url is omitted", async () => {
  let capturedUrl;
  await run(["inspect", "file.pdf", "--api-key", "pm_live_x"], {
    readFileImpl: async () => Buffer.from("x"),
    fetchImpl: async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({ classification: {} }), { status: 200 });
    },
    log: () => {},
    logError: () => {},
  });
  assert.equal(capturedUrl, `${DEFAULT_BASE_URL}/v1/inspect`);
});
