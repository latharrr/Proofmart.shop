#!/usr/bin/env node

// Thin CLI wrapper around the public API (/v1/verify, /v1/inspect,
// /v1/extract) — every byte of PDF processing happens server-side, exactly
// as it does for any other API caller. This file has no document-processing
// logic of its own and never will: it only builds a request, sends it, and
// prints/writes the response.
//
// Dependency-free on purpose: Node 18+'s built-in fetch/FormData/Blob cover
// everything a multipart upload needs, so there's nothing here to audit
// beyond this one file plus Node itself.

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

export const VERSION = "0.1.0";
export const DEFAULT_BASE_URL = "https://proofmart.shop";
const UPLOAD_COMMANDS = new Set(["verify", "inspect", "extract"]);
const RETRIEVAL_COMMANDS = new Set(["list", "get"]);
const COMMANDS = new Set([...UPLOAD_COMMANDS, ...RETRIEVAL_COMMANDS]);

export function helpText() {
  return `proofmart ${VERSION} — command-line client for the ProofMart public API

Usage:
  proofmart verify <file.pdf> [options]
  proofmart inspect <file.pdf> [options]
  proofmart extract <file.pdf> [options]
  proofmart list [--status <s>] [--verdict <v>] [--limit <n>] [--before <iso>]
  proofmart get <document-id> [--result]

Options:
  --api-key <key>    API key (defaults to $PROOFMART_API_KEY)
  --base-url <url>   API base URL (defaults to $PROOFMART_BASE_URL, or ${DEFAULT_BASE_URL})
  --json             Print the full raw JSON response instead of a summary
  --output <path>    Also write the JSON response to a file
  --status <s>       list: filter by status (processing|ready|error)
  --verdict <v>      list: filter by verdict (CLEAR|REVIEW|FAIL|INCONCLUSIVE)
  --limit <n>        list: max documents to return (default 20, max 100)
  --before <iso>     list: only documents created before this ISO timestamp
  --result           get: fetch the full verification result instead of metadata
  -h, --help         Show this help
  -v, --version      Show the CLI version

Examples:
  proofmart verify statement.pdf --api-key pm_live_...
  PROOFMART_API_KEY=pm_live_... proofmart verify statement.pdf --json --output result.json
  proofmart list --status ready --limit 5
  proofmart get 3fa1c2e0-... --result
`;
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--api-key") args.apiKey = argv[++i];
    else if (a === "--base-url") args.baseUrl = argv[++i];
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--status") args.status = argv[++i];
    else if (a === "--verdict") args.verdict = argv[++i];
    else if (a === "--limit") args.limit = argv[++i];
    else if (a === "--before") args.before = argv[++i];
    else if (a === "--result") args.result = true;
    else if (a === "-h" || a === "--help") args.help = true;
    else if (a === "-v" || a === "--version") args.version = true;
    else args._.push(a);
  }
  return args;
}

/** Human-readable default output — `--json` bypasses this entirely and prints the raw response. */
export function summarize(command, body) {
  if (command === "verify") {
    const findings = body.findings ?? [];
    const lines = [`verdict:  ${body.verdict}`, `findings: ${findings.length}`];
    for (const f of findings) lines.push(`  ${String(f.verdict).padEnd(6)} ${f.markerId} — ${f.evidence?.summary ?? ""}`);
    return lines.join("\n");
  }
  if (command === "inspect") {
    const c = body.classification ?? {};
    return [`type:       ${c.pdfType}`, `pages:      ${c.pageCount}`, `confidence: ${c.confidence}`].join("\n");
  }
  if (command === "list") {
    const docs = body.documents ?? [];
    if (docs.length === 0) return "No documents.";
    const lines = docs.map((d) => `${String(d.status).padEnd(10)} ${String(d.verdict ?? "-").padEnd(12)} ${d.filename}  (${d.id})`);
    if (body.nextCursor) lines.push(`\n(more: --before ${body.nextCursor})`);
    return lines.join("\n");
  }
  if (command === "get") {
    if (body.document) {
      const d = body.document;
      return [
        `id:        ${d.id}`,
        `filename:  ${d.filename}`,
        `status:    ${d.status}`,
        `verdict:   ${d.verdict ?? "-"}`,
        `findings:  ${d.findings_count}`,
        `created:   ${d.created_at}`,
      ].join("\n");
    }
    return summarize("verify", body); // --result returns a /v1/verify-shaped envelope
  }
  return [`pages:  ${body.document?.pageCount}`, `facts:  ${body.facts?.length ?? 0}`, `title:  ${body.document?.title ?? "(none)"}`].join("\n");
}

/**
 * Runs one CLI invocation. Takes an injectable `fetchImpl`/`readFileImpl`
 * so tests can exercise real argument-parsing and output-formatting logic
 * without making a real network call or touching the real filesystem.
 */
export async function run(argv, { fetchImpl = fetch, readFileImpl = readFile, writeFileImpl = writeFile, log = console.log, logError = console.error } = {}) {
  const args = parseArgs(argv);
  if (args.help || argv.length === 0) {
    log(helpText());
    return 0;
  }
  if (args.version) {
    log(VERSION);
    return 0;
  }

  const command = args._[0];
  if (!COMMANDS.has(command)) {
    logError(`Unknown command: ${command ?? "(none)"}\n`);
    log(helpText());
    return 1;
  }
  if (UPLOAD_COMMANDS.has(command) && !args._[1]) {
    logError("Missing <file.pdf> argument.\n");
    log(helpText());
    return 1;
  }
  if (command === "get" && !args._[1]) {
    logError("Missing <document-id> argument.\n");
    log(helpText());
    return 1;
  }

  const apiKey = args.apiKey ?? process.env.PROOFMART_API_KEY;
  if (!apiKey) {
    logError("No API key provided. Pass --api-key <key> or set PROOFMART_API_KEY.");
    return 1;
  }
  const baseUrl = args.baseUrl ?? process.env.PROOFMART_BASE_URL ?? DEFAULT_BASE_URL;

  let response;
  if (command === "list") {
    const url = new URL(`${baseUrl}/v1/documents`);
    if (args.status) url.searchParams.set("status", args.status);
    if (args.verdict) url.searchParams.set("verdict", args.verdict);
    if (args.limit) url.searchParams.set("limit", args.limit);
    if (args.before) url.searchParams.set("before", args.before);
    try {
      response = await fetchImpl(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    } catch (err) {
      logError(`Request failed: ${err.message}`);
      return 1;
    }
  } else if (command === "get") {
    const id = args._[1];
    const path = args.result ? `/v1/documents/${id}/result` : `/v1/documents/${id}`;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    } catch (err) {
      logError(`Request failed: ${err.message}`);
      return 1;
    }
  } else {
    const file = args._[1];
    let bytes;
    try {
      bytes = await readFileImpl(file);
    } catch (err) {
      logError(`Could not read ${file}: ${err.message}`);
      return 1;
    }

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "application/pdf" }), basename(file));

    try {
      response = await fetchImpl(`${baseUrl}/v1/${command}`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form });
    } catch (err) {
      logError(`Request failed: ${err.message}`);
      return 1;
    }
  }

  const body = await response.json().catch(() => null);
  if (!body) {
    logError(`Received a non-JSON response (HTTP ${response.status}).`);
    return 1;
  }

  if (args.output) await writeFileImpl(args.output, JSON.stringify(body, null, 2));

  if (!response.ok) {
    logError(args.json ? JSON.stringify(body, null, 2) : `Error: ${body.error?.code ?? response.status} — ${body.error?.message ?? "request failed"}`);
    return 1;
  }

  log(args.json ? JSON.stringify(body, null, 2) : summarize(command, body));
  return 0;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  run(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
