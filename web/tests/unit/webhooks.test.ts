import { describe, expect, it, vi } from "vitest";

describe("signWebhookBody / verifyWebhookSignature", () => {
  it("round-trips: a signature produced for a body verifies against that same body and secret", async () => {
    const { signWebhookBody, verifyWebhookSignature } = await import("@/lib/webhooks/hmac");
    const body = JSON.stringify({ id: "evt_1", type: "verification.completed" });
    const signature = signWebhookBody(body, "whsec_test");
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(verifyWebhookSignature(body, "whsec_test", signature)).toBe(true);
  });

  it("fails verification when the body changes after signing", async () => {
    const { signWebhookBody, verifyWebhookSignature } = await import("@/lib/webhooks/hmac");
    const signature = signWebhookBody(JSON.stringify({ a: 1 }), "whsec_test");
    expect(verifyWebhookSignature(JSON.stringify({ a: 2 }), "whsec_test", signature)).toBe(false);
  });

  it("fails verification with the wrong secret", async () => {
    const { signWebhookBody, verifyWebhookSignature } = await import("@/lib/webhooks/hmac");
    const body = JSON.stringify({ a: 1 });
    const signature = signWebhookBody(body, "whsec_correct");
    expect(verifyWebhookSignature(body, "whsec_wrong", signature)).toBe(false);
  });

  it("rejects a malformed signature header without throwing", async () => {
    const { verifyWebhookSignature } = await import("@/lib/webhooks/hmac");
    expect(() => verifyWebhookSignature("{}", "whsec_test", "not-a-real-signature")).not.toThrow();
    expect(verifyWebhookSignature("{}", "whsec_test", "not-a-real-signature")).toBe(false);
  });
});

describe("checkUrlShape (sync SSRF checks)", () => {
  it("accepts a normal public https URL", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("https://example.com/webhooks/proofmart")).toEqual({ safe: true });
  });

  it("rejects non-http(s) schemes", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("file:///etc/passwd").safe).toBe(false);
    expect(checkUrlShape("ftp://example.com").safe).toBe(false);
  });

  it("rejects an unparseable URL", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("not a url").safe).toBe(false);
  });

  it("rejects localhost", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("http://localhost:3000/hook").safe).toBe(false);
  });

  it("rejects literal loopback and private IPv4 addresses", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("http://127.0.0.1/hook").safe).toBe(false);
    expect(checkUrlShape("http://10.0.0.5/hook").safe).toBe(false);
    expect(checkUrlShape("http://192.168.1.1/hook").safe).toBe(false);
    expect(checkUrlShape("http://172.16.0.1/hook").safe).toBe(false);
  });

  it("rejects the cloud metadata address", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("http://169.254.169.254/latest/meta-data").safe).toBe(false);
  });

  it("rejects literal IPv6 loopback", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("http://[::1]/hook").safe).toBe(false);
  });

  it("accepts a public IPv4 address", async () => {
    const { checkUrlShape } = await import("@/lib/webhooks/url-safety");
    expect(checkUrlShape("http://93.184.216.34/hook")).toEqual({ safe: true });
  });
});

describe("resolveAndCheck (DNS-rebinding protection, dns.lookup mocked)", () => {
  it("rejects a hostname that resolves to a private address", async () => {
    vi.resetModules();
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "10.0.0.1", family: 4 }]) }));
    const { resolveAndCheck } = await import("@/lib/webhooks/url-safety");
    const result = await resolveAndCheck("https://rebound.example.com/hook");
    expect(result.safe).toBe(false);
    vi.doUnmock("node:dns/promises");
    vi.resetModules();
  });

  it("accepts a hostname that resolves only to public addresses", async () => {
    vi.resetModules();
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) }));
    const { resolveAndCheck } = await import("@/lib/webhooks/url-safety");
    const result = await resolveAndCheck("https://example.com/hook");
    expect(result.safe).toBe(true);
    vi.doUnmock("node:dns/promises");
    vi.resetModules();
  });

  it("rejects when DNS resolution fails", async () => {
    vi.resetModules();
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockRejectedValue(new Error("ENOTFOUND")) }));
    const { resolveAndCheck } = await import("@/lib/webhooks/url-safety");
    const result = await resolveAndCheck("https://does-not-exist.invalid/hook");
    expect(result.safe).toBe(false);
    vi.doUnmock("node:dns/promises");
    vi.resetModules();
  });

  it("still rejects unsafe URL shapes before ever touching DNS", async () => {
    const { resolveAndCheck } = await import("@/lib/webhooks/url-safety");
    const result = await resolveAndCheck("ftp://example.com/hook");
    expect(result.safe).toBe(false);
  });
});

describe("webhook delivery backoff", () => {
  it("MAX_ATTEMPTS is the immediate attempt plus every configured retry", async () => {
    const { MAX_ATTEMPTS } = await import("@/lib/webhooks/deliver");
    expect(MAX_ATTEMPTS).toBe(6);
  });
});
