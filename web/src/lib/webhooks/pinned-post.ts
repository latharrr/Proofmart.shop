import "server-only";

import http from "node:http";
import https from "node:https";
import type { LookupAddress } from "node:dns";

/**
 * POSTs to `url`, connecting only to `addresses`: the ones resolveAndCheck just
 * approved. A plain fetch would resolve the hostname a second time, and a DNS
 * answer that changed in between could point it at a private address. TLS still
 * verifies the certificate against the hostname. Redirects are never followed.
 */
export function pinnedPost(
  url: string,
  init: { headers: Record<string, string>; body: string; signal: AbortSignal },
  addresses: LookupAddress[],
): Promise<{ status: number }> {
  const target = new URL(url);
  const lookup = ((_host: string, options: { all?: boolean }, cb: (err: Error | null, address: unknown, family?: number) => void) => {
    if (options?.all) cb(null, addresses);
    else cb(null, addresses[0].address, addresses[0].family);
  }) as never;
  return new Promise((resolve, reject) => {
    const req = (target.protocol === "https:" ? https : http).request(
      target,
      // An IP-literal URL has nothing to resolve and was already checked as written.
      { method: "POST", agent: false, signal: init.signal, headers: { ...init.headers, "content-length": Buffer.byteLength(init.body) }, ...(addresses.length ? { lookup } : {}) },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode ?? 0 });
      },
    );
    // Surface the timeout as the signal's own TimeoutError rather than a generic abort.
    req.on("error", (err) => reject(init.signal.aborted ? init.signal.reason : err));
    req.end(init.body);
  });
}
