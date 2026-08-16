import { describe, expect, it } from "vitest";
import { pruneExpiredRows } from "@/lib/retention";

function fakeSupabase(results: Record<string, { count: number; error?: unknown }>) {
  const calls: Array<{ table: string; column: string; value: string }> = [];
  return {
    client: {
      from(table: string) {
        return {
          delete: () => ({
            lt: async (column: string, value: string) => {
              calls.push({ table, column, value });
              const r = results[table] ?? { count: 0 };
              return { error: r.error ?? null, count: r.error ? null : r.count };
            },
          }),
        };
      },
    } as never,
    calls,
  };
}

describe("pruneExpiredRows", () => {
  it("deletes from every configured table using a cutoff below now, and reports the deleted count", async () => {
    const { client, calls } = fakeSupabase({ rate_limits: { count: 3 }, webhook_deliveries: { count: 0 }, audit_events: { count: 12 } });
    const results = await pruneExpiredRows(client);

    expect(results).toEqual(
      expect.arrayContaining([
        { table: "rate_limits", deleted: 3 },
        { table: "webhook_deliveries", deleted: 0 },
        { table: "audit_events", deleted: 12 },
      ]),
    );

    const now = Date.now();
    for (const call of calls) {
      expect(new Date(call.value).getTime()).toBeLessThan(now);
    }
    expect(calls.find((c) => c.table === "rate_limits")?.column).toBe("window_start");
    expect(calls.find((c) => c.table === "audit_events")?.column).toBe("created_at");

    // Security/audit trail is kept longer than a fixed-window counter that's
    // meaningless past its own window — the cutoff (older = smaller
    // timestamp) should reflect that.
    const rateLimitsCutoff = new Date(calls.find((c) => c.table === "rate_limits")!.value).getTime();
    const auditEventsCutoff = new Date(calls.find((c) => c.table === "audit_events")!.value).getTime();
    expect(auditEventsCutoff).toBeLessThan(rateLimitsCutoff);
  });

  it("reports 0 deleted (not throwing) when a table's delete errors", async () => {
    const { client } = fakeSupabase({ rate_limits: { count: 0, error: new Error("db unavailable") }, webhook_deliveries: { count: 0 }, audit_events: { count: 0 } });
    const results = await pruneExpiredRows(client);
    expect(results.find((r) => r.table === "rate_limits")).toEqual({ table: "rate_limits", deleted: 0 });
  });
});
