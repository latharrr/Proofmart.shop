import { generateKeyPairSync } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { VerificationFinding } from "@/lib/verification/types";

function testKeyPairEnv() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    PROOFMART_SIGNING_PRIVATE_KEY_B64: Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" }).toString()).toString("base64"),
    PROOFMART_SIGNING_PUBLIC_KEY_B64: Buffer.from(publicKey.export({ type: "spki", format: "pem" }).toString()).toString("base64"),
  };
}

const finding: VerificationFinding = {
  id: "f1",
  markerId: "BALANCE_BREAK",
  markerName: "Balance break",
  category: "Arithmetic",
  severity: "critical",
  verdict: "FAIL",
  evidence: { summary: "Balance does not carry forward.", detail: "expected 100, found 90", coordinates: [{ page: 1, rect: { x: 1, y: 2, w: 3, h: 4 } }] },
};

function payload(overrides: Partial<import("@/lib/signing/sign").SignedPayload> = {}) {
  return {
    verificationId: "11111111-1111-1111-1111-111111111111",
    documentIdentifier: "22222222-2222-2222-2222-222222222222",
    engineVersion: "1",
    timestamp: "2026-08-16T00:00:00.000Z",
    documentHash: "a".repeat(64),
    verdict: "FAIL" as const,
    findings: [finding],
    ...overrides,
  };
}

describe("signing (Ed25519, configured)", () => {
  beforeAll(() => {
    Object.assign(process.env, testKeyPairEnv());
  });

  it("signs and verifies a round trip", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload());
    expect(envelope).not.toBeNull();
    expect(verifyVerificationResult(envelope!)).toEqual({ valid: true });
  });

  it("rejects a payload with one changed field (verdict flipped)", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload())!;
    const tampered = { ...envelope, payload: { ...envelope.payload, verdict: "CLEAR" as const } };
    const result = verifyVerificationResult(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects a payload with a finding removed", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload())!;
    const tampered = { ...envelope, payload: { ...envelope.payload, findings: [] } };
    expect(verifyVerificationResult(tampered).valid).toBe(false);
  });

  it("rejects a payload whose key order changed but content is identical (canonicalization sanity) — still verifies true, proving the check is content-based not string-based", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const original = payload();
    const reordered = { findings: original.findings, verdict: original.verdict, documentHash: original.documentHash, timestamp: original.timestamp, engineVersion: original.engineVersion, documentIdentifier: original.documentIdentifier, verificationId: original.verificationId };
    const envelope = signVerificationResult(original)!;
    expect(verifyVerificationResult({ ...envelope, payload: reordered }).valid).toBe(true);
  });

  it("rejects a corrupted signature", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload())!;
    const corrupted = { ...envelope, signature: Buffer.from("not a real signature").toString("base64") };
    expect(verifyVerificationResult(corrupted).valid).toBe(false);
  });

  it("rejects malformed base64 signature without throwing", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload())!;
    const malformed = { ...envelope, signature: "not-base64!!!" };
    expect(() => verifyVerificationResult(malformed)).not.toThrow();
  });

  it("rejects an unrecognized keyId (e.g. signed under a different/rotated key)", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload())!;
    const wrongKey = { ...envelope, keyId: "0000000000000000" };
    expect(verifyVerificationResult(wrongKey)).toEqual({ valid: false, reason: "Unknown signing key: 0000000000000000" });
  });

  it("rejects an unsupported algorithm", async () => {
    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult(payload())!;
    const wrongAlgo = { ...envelope, algorithm: "rsa-sha256" } as unknown as import("@/lib/signing/sign").SignatureEnvelope;
    expect(verifyVerificationResult(wrongAlgo).valid).toBe(false);
  });
});

describe("signing (not configured)", () => {
  it("signVerificationResult returns null rather than throwing or fabricating a signature", async () => {
    vi.resetModules();
    const originalPriv = process.env.PROOFMART_SIGNING_PRIVATE_KEY_B64;
    const originalPub = process.env.PROOFMART_SIGNING_PUBLIC_KEY_B64;
    delete process.env.PROOFMART_SIGNING_PRIVATE_KEY_B64;
    delete process.env.PROOFMART_SIGNING_PUBLIC_KEY_B64;
    try {
      const { signVerificationResult } = await import("@/lib/signing/sign");
      expect(signVerificationResult(payload())).toBeNull();
    } finally {
      if (originalPriv) process.env.PROOFMART_SIGNING_PRIVATE_KEY_B64 = originalPriv;
      if (originalPub) process.env.PROOFMART_SIGNING_PUBLIC_KEY_B64 = originalPub;
      vi.resetModules();
    }
  });
});

describe("canonicalize", () => {
  it("produces identical output regardless of key insertion order", async () => {
    const { canonicalize } = await import("@/lib/signing/canonicalize");
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it("distinguishes nested structures that differ", async () => {
    const { canonicalize } = await import("@/lib/signing/canonicalize");
    expect(canonicalize({ a: [1, 2] })).not.toBe(canonicalize({ a: [2, 1] }));
  });
});
