import { describe, expect, it } from "vitest";
import { isBackslashV1Path } from "@/lib/api/backslash-guard";

describe("isBackslashV1Path", () => {
  it("flags a percent-encoded trailing backslash on a /v1 route", () => {
    expect(isBackslashV1Path("/v1/verify%5C")).toBe(true);
    expect(isBackslashV1Path("/v1/verify%5c")).toBe(true);
  });

  it("flags a literal backslash on a /v1 route", () => {
    expect(isBackslashV1Path("/v1/verify\\")).toBe(true);
    expect(isBackslashV1Path("/v1/a\\b")).toBe(true);
  });

  it("does not flag clean /v1 paths", () => {
    expect(isBackslashV1Path("/v1/verify")).toBe(false);
    expect(isBackslashV1Path("/v1/nonexistent")).toBe(false);
    expect(isBackslashV1Path("/v1/")).toBe(false);
    expect(isBackslashV1Path("/v1")).toBe(false);
  });

  it("does not flag backslashes outside /v1/*", () => {
    expect(isBackslashV1Path("/privacy%5C")).toBe(false);
    expect(isBackslashV1Path("/docs\\x")).toBe(false);
  });

  it("never throws on malformed percent-encoding", () => {
    expect(isBackslashV1Path("/v1/%zz")).toBe(false);
    expect(isBackslashV1Path("/%zz")).toBe(false);
  });
});
