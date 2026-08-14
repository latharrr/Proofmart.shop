import { describe, expect, it } from "vitest";
import { computeVerdict } from "@/lib/verification/verdict";
import type { VerificationFinding } from "@/lib/verification/types";

function finding(overrides: Partial<VerificationFinding> = {}): VerificationFinding {
  return {
    id: "f",
    markerId: "TEST_MARKER",
    markerName: "Test marker",
    category: "Extraction",
    severity: "moderate",
    verdict: "REVIEW",
    evidence: { summary: "s", detail: "d", coordinates: [] },
    ...overrides,
  };
}

describe("computeVerdict precedence", () => {
  it("no markers ran at all -> INCONCLUSIVE, regardless of findings (there shouldn't be any)", () => {
    expect(computeVerdict([], 0)).toBe("INCONCLUSIVE");
  });

  it("markers ran, zero findings -> CLEAR (\"no findings\")", () => {
    expect(computeVerdict([], 3)).toBe("CLEAR");
  });

  it("markers ran, only REVIEW findings -> REVIEW (\"review-only findings\")", () => {
    expect(computeVerdict([finding({ verdict: "REVIEW" })], 1)).toBe("REVIEW");
  });

  it("markers ran, only INCONCLUSIVE findings -> REVIEW (an ambiguous finding still means 'look closer', not 'nothing to see')", () => {
    expect(computeVerdict([finding({ verdict: "INCONCLUSIVE" })], 1)).toBe("REVIEW");
  });

  it("any FAIL finding -> FAIL, even alongside REVIEW findings (\"confirmed failure findings\")", () => {
    const findings = [finding({ verdict: "REVIEW" }), finding({ verdict: "FAIL" })];
    expect(computeVerdict(findings, 2)).toBe("FAIL");
  });

  it("FAIL beats REVIEW regardless of finding order", () => {
    const findings = [finding({ verdict: "FAIL" }), finding({ verdict: "REVIEW" }), finding({ verdict: "INCONCLUSIVE" })];
    expect(computeVerdict(findings, 3)).toBe("FAIL");
  });

  it("multiple FAIL findings from different markers still resolve to a single FAIL verdict", () => {
    const findings = [finding({ markerId: "A", verdict: "FAIL" }), finding({ markerId: "B", verdict: "FAIL" })];
    expect(computeVerdict(findings, 2)).toBe("FAIL");
  });

  it("a marker that ran clean alongside one that found a REVIEW issue -> REVIEW, not CLEAR", () => {
    // markersRunCount reflects both markers running; only one produced a finding.
    expect(computeVerdict([finding({ markerId: "B", verdict: "REVIEW" })], 2)).toBe("REVIEW");
  });
});
