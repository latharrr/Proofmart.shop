import { describe, expect, it } from "vitest";
import {
  accessTokenExpiresAt,
  base64urlDecode,
  shouldSkipSessionRefresh,
  type CookiePair,
} from "@/lib/supabase/session-cookie";

/**
 * The proxy's refresh-skip reads the session cookie's exp WITHOUT verifying
 * the signature — by design, because page/route guards verify it themselves
 * on every protected request. These tests pin the two properties that make
 * that safe and correct:
 *
 *  1. Anything malformed, missing, or unpar decodable falls back to the full
 *     refresh path (never silently skips refresh for a broken session).
 *  2. A FORGED exp can only influence whether the proxy attempts a refresh —
 *     it grants nothing; the test documents that the decode is exp-reading
 *     only, so the security boundary stays visibly in the guards.
 */

const NOW = 1_800_000_000_000; // fixed point in time

function jwtWithExp(expSeconds: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "ES256", typ: "JWT" })}.${b64({ exp: expSeconds, sub: "user-1" })}.forged-signature`;
}

function cookieValueFor(expSeconds: number): string {
  const session = JSON.stringify({ access_token: jwtWithExp(expSeconds), token_type: "bearer" });
  return "base64-" + Buffer.from(session).toString("base64url");
}

const NAME = "sb-llfhgspktwacuvlmxigy-auth-token";

describe("accessTokenExpiresAt", () => {
  it("reads exp from a plain (unchunked, unencoded) session cookie", () => {
    const expS = NOW / 1000 + 3600;
    const cookies: CookiePair[] = [{ name: NAME, value: cookieValueFor(expS) }];
    expect(accessTokenExpiresAt(cookies)).toBe(expS * 1000);
  });

  it("reads exp from a URL-encoded cookie value", () => {
    const expS = NOW / 1000 + 3600;
    const cookies: CookiePair[] = [{ name: NAME, value: encodeURIComponent(cookieValueFor(expS)) }];
    expect(accessTokenExpiresAt(cookies)).toBe(expS * 1000);
  });

  it("assembles chunked cookies in order", () => {
    const expS = NOW / 1000 + 3600;
    const full = encodeURIComponent(cookieValueFor(expS));
    const mid = Math.floor(full.length / 2);
    const cookies: CookiePair[] = [
      { name: `${NAME}.1`, value: full.slice(mid) },
      { name: `${NAME}.0`, value: full.slice(0, mid) },
    ];
    expect(accessTokenExpiresAt(cookies)).toBe(expS * 1000);
  });

  it("ignores unrelated sb- cookies (code verifiers, flows)", () => {
    const expS = NOW / 1000 + 3600;
    const cookies: CookiePair[] = [
      { name: "sb-llfhgspktwacuvlmxigy-auth-token-flow-abc-code-verifier", value: "junk" },
      { name: "sb-llfhgspktwacuvlmxigy-auth-token-flows-code-verifier", value: "junk" },
      { name: NAME, value: cookieValueFor(expS) },
    ];
    expect(accessTokenExpiresAt(cookies)).toBe(expS * 1000);
  });

  it.each([
    ["no cookies", []],
    ["unrelated cookie only", [{ name: "other", value: "x" }]],
    ["empty value", [{ name: NAME, value: "" }]],
    ["not base64, not JSON", [{ name: NAME, value: "garbage!!!" }]],
    ["base64 prefix but bad payload", [{ name: NAME, value: "base64-%%%not-base64%%%" }]],
    ["JSON without access_token", [{ name: NAME, value: encodeURIComponent(JSON.stringify({ token_type: "bearer" })) }]],
    ["token with non-JSON payload", [{ name: NAME, value: "base64-" + Buffer.from(JSON.stringify({ access_token: "a.b.c" })).toString("base64url") }]],
    ["non-numeric exp", [{ name: NAME, value: "base64-" + Buffer.from(JSON.stringify({ access_token: jwtWithExpNaN() })).toString("base64url") }]],
  ])("returns null for %s", (_label, cookies) => {
    expect(accessTokenExpiresAt(cookies as CookiePair[])).toBeNull();
  });

  it("reads a FORGED exp as-is: the decode is not a security check", () => {
    // A far-future exp on an unsigned token is accepted by THIS function.
    // That is safe only because every protected page/route runs getClaims
    // (real signature verification) regardless of the proxy's decision —
    // and this test exists to keep that contract visible.
    const forgedExpS = NOW / 1000 + 365 * 24 * 3600;
    const cookies: CookiePair[] = [{ name: NAME, value: cookieValueFor(forgedExpS) }];
    expect(accessTokenExpiresAt(cookies)).toBe(forgedExpS * 1000);
  });
});

function jwtWithExpNaN(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "ES256" })}.${b64({ exp: "not-a-number" })}.sig`;
}

describe("shouldSkipSessionRefresh", () => {
  const WINDOW = 120_000;

  it("skips refresh when the token has comfortably more than the window left", () => {
    const cookies: CookiePair[] = [{ name: NAME, value: cookieValueFor(NOW / 1000 + 3600) }];
    expect(shouldSkipSessionRefresh(cookies, NOW, WINDOW)).toBe(true);
  });

  it("does NOT skip refresh when the token is inside the window (near expiry)", () => {
    const cookies: CookiePair[] = [{ name: NAME, value: cookieValueFor(NOW / 1000 + 60) }];
    expect(shouldSkipSessionRefresh(cookies, NOW, WINDOW)).toBe(false);
  });

  it("does NOT skip refresh when the token is already expired", () => {
    const cookies: CookiePair[] = [{ name: NAME, value: cookieValueFor(NOW / 1000 - 5) }];
    expect(shouldSkipSessionRefresh(cookies, NOW, WINDOW)).toBe(false);
  });

  it("does NOT skip refresh for malformed or missing cookies", () => {
    expect(shouldSkipSessionRefresh([], NOW, WINDOW)).toBe(false);
    expect(shouldSkipSessionRefresh([{ name: NAME, value: "garbage" }], NOW, WINDOW)).toBe(false);
  });
});

describe("base64urlDecode", () => {
  it("round-trips base64url without padding", () => {
    const original = '{"access_token":"x-y_z","refresh_token":"r"}';
    const encoded = Buffer.from(original).toString("base64url");
    expect(base64urlDecode(encoded)).toBe(original);
  });
});
