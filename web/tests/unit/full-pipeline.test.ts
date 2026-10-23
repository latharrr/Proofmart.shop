import { createHash, generateKeyPairSync } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { runVerify } from "@/lib/api/pipeline";
import { arithmeticInconsistencyPdf } from "../fixtures/build";

/**
 * The whole product in one test: a genuine PDF goes into runVerify — the
 * exact function the POST /v1/verify route handler calls — a real FAIL
 * verdict with real evidence coordinates comes out, and the dossier built
 * from that result carries a signature that verifies. If any link in the
 * chain breaks, this is the test that goes red.
 */
describe("full pipeline: PDF -> runVerify -> signed dossier", () => {
  beforeAll(() => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    vi.stubEnv(
      "PROOFMART_SIGNING_PRIVATE_KEY_B64",
      Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" }).toString()).toString("base64"),
    );
    vi.stubEnv(
      "PROOFMART_SIGNING_PUBLIC_KEY_B64",
      Buffer.from(publicKey.export({ type: "spki", format: "pem" }).toString()).toString("base64"),
    );
  });

  it("a tampered statement verifies FAIL and its dossier signature checks out", async () => {
    const buf = await arithmeticInconsistencyPdf();
    const { document, verification } = await runVerify(buf, {
      filename: "break.pdf",
      sizeBytes: buf.length,
    });

    expect(document.pageCount).toBeGreaterThan(0);
    expect(verification.verdict).toBe("FAIL");
    const finding = verification.findings.find((f) => f.markerId === "BALANCE_BREAK");
    expect(finding).toBeDefined();
    expect(finding?.evidence.coordinates.length).toBeGreaterThan(0);

    const { signVerificationResult, verifyVerificationResult } = await import("@/lib/signing/sign");
    const envelope = signVerificationResult({
      verificationId: "33333333-3333-3333-3333-333333333333",
      documentIdentifier: "44444444-4444-4444-4444-444444444444",
      engineVersion: "test",
      timestamp: new Date().toISOString(),
      documentHash: createHash("sha256").update(buf).digest("hex"),
      verdict: verification.verdict,
      findings: verification.findings,
    });
    expect(envelope).not.toBeNull();
    expect(verifyVerificationResult(envelope!)).toEqual({ valid: true });
  });
});
