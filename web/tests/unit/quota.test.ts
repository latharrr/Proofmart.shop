import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Item 9 (LAUNCH.md): the monthly plan quota in lib/billing/usage.ts must be
 * enforced on /v1/inspect and /v1/extract exactly as it is on /v1/verify.
 * These tests call the route handlers directly with the Supabase usage store
 * fully mocked — no live database, no network, no PDF bytes. The 51st call
 * on a Free plan (50 calls/month) must be rejected with 402 quota_exceeded
 * before any processing runs.
 */
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import { POST as extractPost } from "@/app/v1/extract/route";
import { POST as inspectPost } from "@/app/v1/inspect/route";

const mockedCreateServiceClient = vi.mocked(createServiceClient);
type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

const FREE_KEY_ROW = { id: "key-free-1", user_id: "user-free-1", revoked_at: null };

type PendingResult = { data: unknown; error: null } | { count: number; error: null };

interface FakeQueryBuilder {
  select(): FakeQueryBuilder;
  eq(): FakeQueryBuilder;
  in(): FakeQueryBuilder;
  gte(): FakeQueryBuilder;
  update(): FakeQueryBuilder;
  maybeSingle(): Promise<PendingResult>;
  then(onFulfilled: (value: PendingResult) => unknown): Promise<unknown>;
}

/**
 * Builds the fake Supabase client the routes see. Only the tables touched
 * by the auth → rate-limit → quota path are faked; anything else would mean
 * the test wandered past the quota gate.
 */
function fakeSupabase({ usedThisMonth }: { usedThisMonth: number }): ServiceClient {
  let pendingResult: PendingResult = { data: null, error: null };
  const builder: FakeQueryBuilder = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    gte: () => builder,
    update: () => builder,
    maybeSingle: () => Promise.resolve(pendingResult),
    // The api_usage_events count query is awaited directly (no maybeSingle).
    then: (onFulfilled) => Promise.resolve(pendingResult).then(onFulfilled),
  };
  return {
    from: (table: string) => {
      if (table === "api_keys") {
        pendingResult = { data: FREE_KEY_ROW, error: null };
      } else if (table === "subscriptions") {
        // No subscription row → free plan (50 calls/month).
        pendingResult = { data: null, error: null };
      } else if (table === "api_usage_events") {
        pendingResult = { count: usedThisMonth, error: null };
      }
      return builder;
    },
    // Rate limiter: always under the per-minute abuse limit.
    rpc: () => Promise.resolve({ data: true, error: null }),
  } as unknown as ServiceClient;
}

function authedRequest(path: string): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { authorization: "Bearer pm_test_free_key" },
  });
}

async function errorBody(res: Response) {
  const json = (await res.json()) as { error?: { code?: string }; requestId?: string };
  return { status: res.status, code: json.error?.code, hasRequestId: typeof json.requestId === "string" };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("/v1/extract quota (Free plan, 50 calls/month)", () => {
  it("rejects the 51st call in a month with 402 quota_exceeded", async () => {
    mockedCreateServiceClient.mockReturnValue(fakeSupabase({ usedThisMonth: 50 }));
    const res = await extractPost(authedRequest("/v1/extract"));
    const { status, code, hasRequestId } = await errorBody(res);
    expect(status).toBe(402);
    expect(code).toBe("quota_exceeded");
    expect(hasRequestId).toBe(true);
  });

  it("lets the 1st call through the quota gate (usage 0 → past quota, stops at missing file body)", async () => {
    mockedCreateServiceClient.mockReturnValue(fakeSupabase({ usedThisMonth: 0 }));
    const res = await extractPost(authedRequest("/v1/extract"));
    // No multipart body attached, so the route proceeds past the quota check
    // and stops at input validation — 400, not 402.
    const { status, code } = await errorBody(res);
    expect(status).toBe(400);
    expect(code).toBe("invalid_request");
  });
});

describe("/v1/inspect quota (Free plan, 50 calls/month)", () => {
  it("rejects the 51st call in a month with 402 quota_exceeded", async () => {
    mockedCreateServiceClient.mockReturnValue(fakeSupabase({ usedThisMonth: 50 }));
    const res = await inspectPost(authedRequest("/v1/inspect"));
    const { status, code, hasRequestId } = await errorBody(res);
    expect(status).toBe(402);
    expect(code).toBe("quota_exceeded");
    expect(hasRequestId).toBe(true);
  });
});
