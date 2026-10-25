import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The password-reset action deliberately swallows most errors (an error
 * would reveal which emails have accounts), with one exception: a rate
 * limit means NO email was sent, so showing "check your inbox" would be a
 * lie. These tests pin that contract with a mocked Supabase client — the
 * real 100-user burst is never exercised.
 */

const { resetPasswordForEmail, recordAuditEvent } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  recordAuditEvent: vi.fn(),
}));

// redirect() in Next throws a NEXT_REDIRECT error; mock it to throw a
// catchable error carrying the target URL.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "https://proofmart.shop" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => true,
  createClient: async () => ({ auth: { resetPasswordForEmail } }),
}));
vi.mock("@/lib/audit", () => ({ recordAuditEvent }));

import { requestPasswordReset } from "@/app/account/reset-password/actions";

function form(email: string): FormData {
  const fd = new FormData();
  fd.set("email", email);
  return fd;
}

async function target(): Promise<string> {
  try {
    await requestPasswordReset(form("someone@example.com"));
  } catch (e) {
    const m = String(e).match(/^Error: REDIRECT:(.+)$/);
    if (m) return m[1];
    throw e;
  }
  throw new Error("requestPasswordReset did not redirect");
}

describe("requestPasswordReset rate-limit honesty", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the busy state (not 'check your inbox') when Supabase returns 429", async () => {
    resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { name: "AuthApiError", status: 429, code: "over_email_send_rate_limit", message: "rate limit" },
    });
    await expect(target()).resolves.toBe("/account/reset-password?busy=1");
    // The request must still land in the audit trail even when rate limited.
    expect(recordAuditEvent).toHaveBeenCalledTimes(1);
  });

  it("shows the busy state on a 429 with no rate-limit code attached", async () => {
    resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { name: "AuthApiError", status: 429, message: "Too many requests" },
    });
    await expect(target()).resolves.toBe("/account/reset-password?busy=1");
  });

  it("keeps the silent 'sent' confirmation for non-rate-limit errors (enumeration safety)", async () => {
    resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { name: "AuthApiError", status: 500, code: "unexpected_failure", message: "boom" },
    });
    await expect(target()).resolves.toBe("/account/reset-password?sent=1");
  });

  it("keeps the 'sent' confirmation on success", async () => {
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await expect(target()).resolves.toBe("/account/reset-password?sent=1");
  });
});
