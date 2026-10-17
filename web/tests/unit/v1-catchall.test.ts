import { describe, expect, it, vi, beforeEach } from "vitest";
import { DELETE, GET, PATCH, POST, PUT } from "@/app/v1/[...path]/route";

/**
 * Item 13 (LAUNCH.md): unknown /v1/* paths — including malformed ones like
 * /v1/verify\ (trailing backslash), which once 500'd — must return a JSON
 * 404, not a 500 and not an HTML 404. The handler functions are called
 * directly; routing precedence (concrete routes win over the catch-all) is
 * Next.js's own behavior, not something to unit-test.
 */
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const METHODS = [
  ["GET", GET],
  ["POST", POST],
  ["PUT", PUT],
  ["PATCH", PATCH],
  ["DELETE", DELETE],
] as const;

describe("v1 catch-all", () => {
  for (const [method, handler] of METHODS) {
    it(`${method} /v1/does-not-exist returns JSON { error: "not_found" } with status 404`, async () => {
      const res = await handler(new Request("http://localhost/v1/does-not-exist", { method }));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    });
  }

  it("POST /v1/verify\\ (trailing backslash) returns JSON 404, not a 500", async () => {
    const res = await POST(new Request("http://localhost/v1/verify%5C", { method: "POST" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});
