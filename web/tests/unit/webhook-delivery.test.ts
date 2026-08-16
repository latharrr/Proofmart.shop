import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fakes just enough of the Supabase JS query-builder chain attemptDelivery
 * actually calls (`.from(...).select(...).eq(...).maybeSingle()` and
 * `.from(...).update(...).eq(...)`) — a real SupabaseClient talks to the
 * network on construction, which these tests deliberately avoid; the goal
 * here is attemptDelivery's own branching logic, not Supabase's client.
 */
function fakeSupabase(deliveryRow: Record<string, unknown> | null) {
  const updates: Array<{ table: string; id: string; patch: Record<string, unknown> }> = [];
  const client = {
    from(table: string) {
      return {
        select: () => ({
          eq: (_col: string, id: string) => ({
            maybeSingle: async () => ({ data: table === "webhook_deliveries" && deliveryRow && deliveryRow.id === id ? deliveryRow : null }),
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => {
            updates.push({ table, id, patch });
            return Promise.resolve({ data: null, error: null });
          },
        }),
      };
    },
  };
  return { client: client as never, updates };
}

const baseDelivery = {
  id: "11111111-1111-1111-1111-111111111111",
  event_type: "verification.completed",
  payload: { id: "11111111-1111-1111-1111-111111111111", type: "verification.completed", result: { verdict: "CLEAR" } },
  attempt_count: 0,
  webhook_endpoints: { url: "https://example.com/hook", secret: "whsec_test", enabled: true },
};

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("attemptDelivery", () => {
  it("marks success on a 2xx response and sends the expected headers/body", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const { client, updates } = fakeSupabase(baseDelivery);
    await attemptDelivery(client, baseDelivery.id);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com/hook");
    expect(init.method).toBe("POST");
    expect(init.headers["x-proofmart-event"]).toBe("verification.completed");
    expect(init.headers["x-proofmart-delivery"]).toBe(baseDelivery.id);
    expect(init.headers["x-proofmart-signature"]).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(JSON.parse(init.body)).toEqual(baseDelivery.payload);

    const update = updates.find((u) => u.table === "webhook_deliveries");
    expect(update?.patch).toMatchObject({ status: "success", attempt_count: 1, last_response_status: 200, next_retry_at: null });
  });

  it("schedules a retry on a non-2xx response, without ever including the payload in last_error", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("some receiver-controlled body", { status: 500 })));

    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const { client, updates } = fakeSupabase(baseDelivery);
    await attemptDelivery(client, baseDelivery.id);

    const update = updates.find((u) => u.table === "webhook_deliveries");
    expect(update?.patch.status).toBe("pending");
    expect(update?.patch.attempt_count).toBe(1);
    expect(update?.patch.last_response_status).toBe(500);
    expect(update?.patch.next_retry_at).toBeTruthy();
    expect(String(update?.patch.last_error)).not.toContain("some receiver-controlled body");
  });

  it("marks exhausted once every retry attempt has been used", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const { attemptDelivery, MAX_ATTEMPTS } = await import("@/lib/webhooks/deliver");
    const { client, updates } = fakeSupabase({ ...baseDelivery, attempt_count: MAX_ATTEMPTS - 1 });
    await attemptDelivery(client, baseDelivery.id);

    const update = updates.find((u) => u.table === "webhook_deliveries");
    expect(update?.patch).toMatchObject({ status: "exhausted", attempt_count: MAX_ATTEMPTS, next_retry_at: null });
  });

  it("treats a network/timeout error the same as a failed attempt, never throwing", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) }));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "TimeoutError" })));

    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const { client, updates } = fakeSupabase(baseDelivery);
    await expect(attemptDelivery(client, baseDelivery.id)).resolves.toBeUndefined();

    const update = updates.find((u) => u.table === "webhook_deliveries");
    expect(update?.patch.status).toBe("pending");
    expect(update?.patch.last_error).toContain("timed out");
  });

  it("never attempts a fetch for a disabled endpoint", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const disabled = { ...baseDelivery, webhook_endpoints: { ...baseDelivery.webhook_endpoints, enabled: false } };
    const { client, updates } = fakeSupabase(disabled);
    await attemptDelivery(client, baseDelivery.id);

    expect(fetchMock).not.toHaveBeenCalled();
    const update = updates.find((u) => u.table === "webhook_deliveries");
    expect(update?.patch).toMatchObject({ status: "failed", next_retry_at: null });
  });

  it("never attempts a fetch for a URL that fails the safety check (SSRF)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const unsafe = { ...baseDelivery, webhook_endpoints: { ...baseDelivery.webhook_endpoints, url: "http://127.0.0.1:9999/hook" } };
    const { client, updates } = fakeSupabase(unsafe);
    await attemptDelivery(client, baseDelivery.id);

    expect(fetchMock).not.toHaveBeenCalled();
    const update = updates.find((u) => u.table === "webhook_deliveries");
    expect(update?.patch.status).toBe("failed");
  });

  it("retries (does not permanently kill the webhook) when the URL safety check itself fails transiently, e.g. a DNS timeout — regression test for a real bug caught in live E2E testing", async () => {
    vi.doMock("node:dns/promises", () => ({ lookup: vi.fn().mockRejectedValue(new Error("DNS lookup timed out")) }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const { client, updates } = fakeSupabase(baseDelivery); // baseDelivery's URL is a normal https:// hostname, not a literal IP — this exercises resolveAndCheck's async DNS path.
    await attemptDelivery(client, baseDelivery.id);

    expect(fetchMock).not.toHaveBeenCalled();
    const update = updates.find((u) => u.table === "webhook_deliveries");
    // The bug: this used to be `status: "failed", next_retry_at: null` (permanent), indistinguishable from a genuinely unsafe URL.
    expect(update?.patch.status).toBe("pending");
    expect(update?.patch.attempt_count).toBe(1);
    expect(update?.patch.next_retry_at).toBeTruthy();
  });

  it("does nothing when the delivery row doesn't exist (already deleted, e.g. by a cascaded webhook deletion)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { attemptDelivery } = await import("@/lib/webhooks/deliver");
    const { client } = fakeSupabase(null);
    await expect(attemptDelivery(client, "does-not-exist")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
