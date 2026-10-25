import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * getVerifiedClaims() (src/lib/supabase/server.ts) exists because every
 * per-request Supabase client otherwise re-downloads the project JWKS
 * before it can verify a session JWT — a full network round trip added to
 * every guarded page. These tests pin the cache semantics that make the
 * optimization safe:
 *
 *  - the JWKS is fetched once and reused within the TTL;
 *  - a stale cache (past TTL) refetches, so key rotation can't wedge the
 *    app on an old key set;
 *  - a fetch failure degrades to the client's own getClaims path
 *    (which fetches JWKS itself) instead of failing the request;
 *  - the cached set is handed to getClaims via the SDK's supported
 *    options.jwks — and the SDK itself falls through to a fresh fetch when
 *    the token's kid is not in the provided set (GoTrueClient.fetchJwk),
 *    so rotation mid-TTL self-heals.
 *
 * Environment note: server.ts calls next/headers' cookies(); it is mocked
 * here because these tests exercise the claims helper, not cookie wiring.
 */

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

const JWKS = { keys: [{ kid: "key-1", kty: "EC", crv: "P-256", x: "x", y: "y" }] };

function fakeSupabase() {
  return { auth: { getClaims: vi.fn(async (_jwt?: string, _options?: unknown) => ({ data: { claims: { sub: "u" } }, error: null })) } };
}

describe("getVerifiedClaims JWKS caching", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "anon-key";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the JWKS once and hands it to getClaims on every call within the TTL", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(JWKS), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getVerifiedClaims } = await import("@/lib/supabase/server");
    const client = fakeSupabase();

    await getVerifiedClaims(client as never);
    await getVerifiedClaims(client as never);
    await getVerifiedClaims(client as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe("https://project.supabase.co/auth/v1/.well-known/jwks.json");
    for (const call of client.auth.getClaims.mock.calls) {
      expect(call[0]).toBeUndefined();
      expect(call[1]).toEqual({ jwks: JWKS });
    }
  });

  it("refetches after the TTL so a rotated key set is picked up", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(async () => new Response(JSON.stringify(JWKS), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      const { getVerifiedClaims } = await import("@/lib/supabase/server");
      const client = fakeSupabase();

      await getVerifiedClaims(client as never);
      vi.setSystemTime(Date.now() + 11 * 60 * 1000); // past the 10-minute TTL
      await getVerifiedClaims(client as never);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("degrades to plain getClaims (client's own JWKS fetch) when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const { getVerifiedClaims } = await import("@/lib/supabase/server");
    const client = fakeSupabase();

    const result = await getVerifiedClaims(client as never);

    expect(client.auth.getClaims).toHaveBeenCalledWith(undefined, undefined);
    expect(result.error).toBeNull(); // request path did not fail
  });

  it.each([
    ["empty object", {}],
    ["empty keys array", { keys: [] }],
    ["keys missing kid/kty", { keys: [{ foo: "bar" }] }],
    ["non-object body", "not-json-object"],
  ])("does NOT cache a malformed 200 body (%s) — next call retries the fetch", async (_label, body) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getVerifiedClaims } = await import("@/lib/supabase/server");
    const client = fakeSupabase();

    await getVerifiedClaims(client as never);
    await getVerifiedClaims(client as never);

    // Every call falls back to the client's own getClaims path, and the
    // malformed body is never cached: the fetch is retried each time.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of client.auth.getClaims.mock.calls) {
      expect(call[1]).toBeUndefined();
    }
  });

  it("caches again normally after a malformed response is followed by a valid one", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ keys: [] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify(JWKS), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getVerifiedClaims } = await import("@/lib/supabase/server");
    const client = fakeSupabase();

    await getVerifiedClaims(client as never); // malformed → fallback, not cached
    await getVerifiedClaims(client as never); // valid → cached
    await getVerifiedClaims(client as never); // cache hit

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(client.auth.getClaims.mock.calls[2][1]).toEqual({ jwks: JWKS });
  });

  it("degrades to plain getClaims on a non-200 JWKS response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    const { getVerifiedClaims } = await import("@/lib/supabase/server");
    const client = fakeSupabase();

    await getVerifiedClaims(client as never);

    expect(client.auth.getClaims).toHaveBeenCalledWith(undefined, undefined);
  });
});
