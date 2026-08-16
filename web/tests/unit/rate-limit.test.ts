import { beforeEach, describe, expect, it, vi } from "vitest";

function fakeServiceClient(rpcImpl: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: rpcImpl };
}

beforeEach(() => {
  vi.resetModules();
});

describe("checkRateLimit", () => {
  it("allows the request when the RPC returns true, and calls it with a bucketed window_start + the given key/limit", async () => {
    let capturedArgs: Record<string, unknown> | undefined;
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => fakeServiceClient(async (fn, args) => {
        capturedArgs = args;
        expect(fn).toBe("check_rate_limit");
        return { data: true, error: null };
      }),
    }));
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const allowed = await checkRateLimit("test:key", 60, 10);
    expect(allowed).toBe(true);
    expect(capturedArgs).toMatchObject({ p_key: "test:key", p_limit: 10 });
    expect(typeof capturedArgs?.p_window_start).toBe("string");
  });

  it("denies the request when the RPC returns false", async () => {
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => fakeServiceClient(async () => ({ data: false, error: null })),
    }));
    const { checkRateLimit } = await import("@/lib/rate-limit");
    expect(await checkRateLimit("test:key", 60, 10)).toBe(false);
  });

  it("fails open (allows) when Supabase isn't configured, matching this codebase's degrade-not-crash pattern", async () => {
    vi.doMock("@/lib/supabase/service", () => ({ createServiceClient: () => null }));
    const { checkRateLimit } = await import("@/lib/rate-limit");
    expect(await checkRateLimit("test:key", 60, 10)).toBe(true);
  });

  it("fails open when the RPC call itself errors (e.g. transient DB issue) rather than 500ing the request it's guarding", async () => {
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => fakeServiceClient(async () => ({ data: null, error: new Error("connection reset") })),
    }));
    const { checkRateLimit } = await import("@/lib/rate-limit");
    expect(await checkRateLimit("test:key", 60, 10)).toBe(true);
  });

  it("buckets window_start to a fixed boundary, not the exact call time — two calls in the same window get the same p_window_start", async () => {
    const seen: string[] = [];
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => fakeServiceClient(async (_fn, args) => {
        seen.push(args.p_window_start as string);
        return { data: true, error: null };
      }),
    }));
    const { checkRateLimit } = await import("@/lib/rate-limit");
    await checkRateLimit("k", 3600, 10);
    await checkRateLimit("k", 3600, 10);
    expect(seen[0]).toBe(seen[1]);
  });
});

describe("clientIp", () => {
  it("takes the first address from a comma-separated x-forwarded-for", async () => {
    const { clientIp } = await import("@/lib/rate-limit");
    const req = new Request("https://example.com", { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } });
    expect(clientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    const { clientIp } = await import("@/lib/rate-limit");
    const req = new Request("https://example.com", { headers: { "x-real-ip": "203.0.113.9" } });
    expect(clientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to 'unknown' when neither header is present", async () => {
    const { clientIp } = await import("@/lib/rate-limit");
    const req = new Request("https://example.com");
    expect(clientIp(req)).toBe("unknown");
  });
});
