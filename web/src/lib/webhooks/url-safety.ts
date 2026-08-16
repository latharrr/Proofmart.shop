import "server-only";

import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";

/**
 * Blocks a webhook URL from ever making this server issue a request to
 * itself, a cloud metadata endpoint, or another host on a private network —
 * the standard SSRF risk any "fetch a URL the user gave us" feature carries.
 * Applied twice: once at registration time (reject obviously-unsafe URLs
 * before they're ever stored) and once again immediately before each
 * delivery attempt (closes the DNS-rebinding gap — a hostname that resolved
 * to a public IP at registration can be repointed at a private one by the
 * time delivery actually happens).
 */

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

/** `URL#hostname` keeps the brackets around an IPv6 literal (`new URL("http://[::1]/").hostname === "[::1]"`) — `net.isIP`/`dns.lookup` both expect the bare address, so every IP check in this file normalizes through this first. */
function stripBrackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata 169.254.169.254)
  if (a === 0) return true; // "this network"
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower.startsWith("fe80:") || lower.startsWith("fe80::")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (fc00::/7)
  if (lower.startsWith("::ffff:")) return isPrivateIPv4(lower.slice("::ffff:".length)); // IPv4-mapped
  return false;
}

function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // not a recognizable IP at all — refuse rather than guess
}

export interface UrlSafetyResult {
  safe: boolean;
  reason?: string;
  /**
   * Only meaningful when `safe: false`. `true` for a transient failure to
   * even determine safety (DNS timeout, temporary resolution failure) — the
   * caller should treat this like any other failed delivery attempt and
   * retry later, not as a verdict that the URL itself is bad. `false` (the
   * default) means the URL was definitively evaluated as unsafe and should
   * never be retried, no matter how many attempts remain.
   */
  retryable?: boolean;
}

/** Cheap, synchronous checks — scheme, hostname denylist, literal private IPs typed directly into the URL. Always run before the async resolveAndCheck. */
export function checkUrlShape(rawUrl: string): UrlSafetyResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Not a valid URL." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { safe: false, reason: "Only http:// and https:// URLs are allowed." };
  }
  const hostname = stripBrackets(url.hostname.toLowerCase());
  if (BLOCKED_HOSTNAMES.has(hostname)) return { safe: false, reason: "This hostname is not allowed." };
  if (isIP(hostname) && isPrivateIp(hostname)) return { safe: false, reason: "URLs pointing at a private or loopback address are not allowed." };
  return { safe: true };
}

const DNS_TIMEOUT_MS = 5000;

/** `dns.lookup` (unlike `fetch`) takes no timeout option and can hang far longer than any request-handling path should tolerate — confirmed directly in this environment, where a single lookup took over 8s. Races it against a timer instead of trusting it to resolve promptly. */
function lookupWithTimeout(hostname: string): Promise<LookupAddress[]> {
  return Promise.race([
    lookup(hostname, { all: true }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DNS lookup timed out")), DNS_TIMEOUT_MS)),
  ]);
}

/** Resolves the hostname and checks every returned address — run immediately before each delivery attempt (registration-time-only checking is exactly what a DNS-rebinding attack bypasses). */
export async function resolveAndCheck(rawUrl: string): Promise<UrlSafetyResult> {
  const shape = checkUrlShape(rawUrl);
  if (!shape.safe) return shape;

  const hostname = stripBrackets(new URL(rawUrl).hostname);
  if (isIP(hostname)) return { safe: true }; // already checked in checkUrlShape

  try {
    const records = await lookupWithTimeout(hostname);
    if (records.length === 0) return { safe: false, reason: "Hostname does not resolve.", retryable: true };
    if (records.some((r) => isPrivateIp(r.address))) {
      return { safe: false, reason: "Hostname resolves to a private or loopback address." };
    }
    return { safe: true };
  } catch {
    // A DNS timeout or lookup error says nothing about whether the URL is
    // actually unsafe — only that this attempt couldn't find out. Treating
    // that the same as a confirmed-private-IP result would let one slow
    // resolver response permanently kill a webhook that's otherwise fine.
    return { safe: false, reason: "Hostname could not be resolved (or resolution timed out).", retryable: true };
  }
}
