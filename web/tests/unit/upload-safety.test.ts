import { describe, expect, it } from "vitest";
import { isTrustedBlobUrl, sanitizeFilename } from "@/app/api/inspect/route";

describe("isTrustedBlobUrl (SSRF guard on the {blobUrl} processing path)", () => {
  it("accepts a genuine Vercel Blob public storage URL", () => {
    expect(isTrustedBlobUrl("https://abc123.public.blob.vercel-storage.com/statement-xyz.pdf")).toBe(true);
  });

  it("rejects an arbitrary external host", () => {
    expect(isTrustedBlobUrl("https://evil.example.com/statement.pdf")).toBe(false);
  });

  it("rejects a host merely containing the trusted suffix as a substring, not as its actual domain", () => {
    expect(isTrustedBlobUrl("https://public.blob.vercel-storage.com.evil.com/x.pdf")).toBe(false);
  });

  it("rejects plain http (not https)", () => {
    expect(isTrustedBlobUrl("http://abc123.public.blob.vercel-storage.com/x.pdf")).toBe(false);
  });

  it("rejects internal/local addresses an attacker might try for SSRF", () => {
    expect(isTrustedBlobUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isTrustedBlobUrl("https://localhost/x.pdf")).toBe(false);
    expect(isTrustedBlobUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects malformed URLs instead of throwing", () => {
    expect(isTrustedBlobUrl("not a url")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("strips directory components (path traversal)", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\windows\\system32\\evil.pdf")).toBe("evil.pdf");
  });

  it("strips control characters", () => {
    expect(sanitizeFilename("statement\x00.pdf\n")).toBe("statement.pdf");
  });

  it("caps length", () => {
    expect(sanitizeFilename("a".repeat(500) + ".pdf")).toHaveLength(255);
  });

  it("falls back to a default name when nothing usable remains", () => {
    expect(sanitizeFilename("")).toBe("upload.pdf");
    expect(sanitizeFilename("/")).toBe("upload.pdf");
  });

  it("leaves an ordinary filename untouched", () => {
    expect(sanitizeFilename("hdfc_apr25_statement.pdf")).toBe("hdfc_apr25_statement.pdf");
  });
});
