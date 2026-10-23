/**
 * A backslash in a /v1/* request path — literal or percent-encoded (`%5C`) —
 * makes Next.js route matching throw on Vercel's edge before the
 * `src/app/v1/[...path]` catch-all is consulted, producing a 500 where a 404
 * belongs (LAUNCH.md item 13). The middleware (`src/proxy.ts`) runs before
 * routing, so it consults this guard first and answers with the same JSON 404
 * the catch-all returns for any other unknown /v1 path.
 *
 * Pure function over the raw pathname so it can be unit-tested without a
 * request. Never throws, even on malformed percent-encoding.
 */
export function isBackslashV1Path(rawPathname: string): boolean {
  let decodedPathname = rawPathname;
  try {
    decodedPathname = decodeURIComponent(rawPathname);
  } catch {
    // Malformed percent-encoding: fall through to the raw-path checks.
  }
  const targetsV1 =
    rawPathname.startsWith("/v1/") || decodedPathname.startsWith("/v1/");
  if (!targetsV1) return false;
  return (
    rawPathname.includes("\\") ||
    decodedPathname.includes("\\") ||
    /%5c/i.test(rawPathname)
  );
}
