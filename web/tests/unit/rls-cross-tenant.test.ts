import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Live integration tests against the real Supabase project's RLS policies —
 * not mocks. There is no meaningful way to unit-test row-level security
 * without a real Postgres instance enforcing it, and the instructions this
 * gate implements explicitly ask for regression tests proving cross-user
 * isolation, not just a manual check.
 *
 * .env.local isn't loaded by vitest automatically (see vitest.config.ts) —
 * read directly here, same pattern this session has used for every other
 * live-credential script. Skips entirely (not a failure) when credentials
 * aren't available, e.g. a CI environment with no Supabase project.
 */
function loadEnvLocal(): Record<string, string> {
  if (!existsSync(".env.local")) return {};
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

const env = { ...loadEnvLocal(), ...process.env };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const hasCreds = Boolean(SUPABASE_URL && SUPABASE_KEY && SERVICE_KEY);

// Two long-lived, dedicated test accounts already provisioned in this
// project for exactly this purpose (see Gate 4/5 E2E verification).
const USER_A = { email: "gate4-e2e-test@proofmart.internal", password: "Gate4TestPassword!2026" };
const USER_B = { email: "gate5-e2e-test@proofmart.internal", password: "Gate5TestPassword!2026" };

describe.skipIf(!hasCreds)("cross-tenant RLS isolation (live Supabase project)", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userAId: string;
  let userBId: string;
  let documentId: string;
  let apiKeyId: string;
  let webhookId: string;
  let signatureId: string;
  let deliveryId: string;

  beforeAll(async () => {
    clientA = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
    clientB = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: a, error: aErr } = await clientA.auth.signInWithPassword(USER_A);
    if (aErr || !a.user) throw new Error(`Could not sign in as USER_A: ${aErr?.message}`);
    userAId = a.user.id;

    const { data: b, error: bErr } = await clientB.auth.signInWithPassword(USER_B);
    if (bErr || !b.user) throw new Error(`Could not sign in as USER_B: ${bErr?.message}`);
    userBId = b.user.id;

    // User A creates one row in every RLS-protected table this gate covers,
    // as User A (a real authenticated insert, not a service-role bypass —
    // this is exactly how the app itself creates these rows).
    const doc = await clientA.from("documents").insert({ user_id: userAId, filename: "rls-test.pdf", size_bytes: 100, status: "ready" }).select("id").single();
    if (doc.error || !doc.data) throw new Error(`Setup: could not create test document: ${doc.error?.message}`);
    documentId = doc.data.id;

    // key_hash is unique — a fixed literal would collide with a previous
    // run's leftover row if a prior attempt failed before cleanup ran.
    const uniqueHash = `${Date.now()}${Math.random()}`.padEnd(64, "0").slice(0, 64);
    const key = await clientA.from("api_keys").insert({ user_id: userAId, name: "rls-test-key", key_prefix: "pm_live_rlstest", key_hash: uniqueHash }).select("id").single();
    if (key.error || !key.data) throw new Error(`Setup: could not create test API key: ${key.error?.message}`);
    apiKeyId = key.data.id;

    const hook = await clientA.from("webhook_endpoints").insert({ user_id: userAId, url: "https://example.com/rls-test-hook", secret: "whsec_rlstest" }).select("id").single();
    if (hook.error || !hook.data) throw new Error(`Setup: could not create test webhook: ${hook.error?.message}`);
    webhookId = hook.data.id;

    const sig = await clientA
      .from("verification_signatures")
      .insert({ document_id: documentId, user_id: userAId, document_hash: "0".repeat(64), engine_version: "1", verdict: "CLEAR", payload: {}, signature: "x", key_id: "test" })
      .select("id")
      .single();
    if (sig.error || !sig.data) throw new Error(`Setup: could not create test signature: ${sig.error?.message}`);
    signatureId = sig.data.id;

    // webhook_deliveries has no INSERT policy for authenticated users on
    // purpose (see the create_webhooks migration) — only the service role
    // ever writes a delivery row, exactly as the real dispatch path does.
    const serviceClient = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
    const delivery = await serviceClient
      .from("webhook_deliveries")
      .insert({ webhook_endpoint_id: webhookId, user_id: userAId, event_type: "verification.completed", verification_id: "rls-test", payload: {} })
      .select("id")
      .single();
    if (delivery.error || !delivery.data) throw new Error(`Setup: could not create test delivery: ${delivery.error?.message}`);
    deliveryId = delivery.data.id;
  });

  afterAll(async () => {
    // Cleanup as User A (the real owner) — cascading deletes handle the
    // webhook_deliveries/verification_signatures rows.
    await clientA.from("documents").delete().eq("id", documentId);
    await clientA.from("api_keys").delete().eq("id", apiKeyId);
    await clientA.from("webhook_endpoints").delete().eq("id", webhookId);
  });

  it("User B cannot see User A's document, and cannot delete or update it", async () => {
    const read = await clientB.from("documents").select("id").eq("id", documentId);
    expect(read.data).toEqual([]);

    await clientB.from("documents").delete().eq("id", documentId);
    await clientB.from("documents").update({ filename: "hijacked.pdf" }).eq("id", documentId);

    // Confirm as the real owner that nothing actually changed.
    const stillThere = await clientA.from("documents").select("id, filename").eq("id", documentId).single();
    expect(stillThere.data?.filename).toBe("rls-test.pdf");
  });

  it("User B cannot see, revoke, or read the hash of User A's API key", async () => {
    const read = await clientB.from("api_keys").select("id, key_hash").eq("id", apiKeyId);
    expect(read.data).toEqual([]);

    await clientB.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", apiKeyId);
    const stillActive = await clientA.from("api_keys").select("revoked_at").eq("id", apiKeyId).single();
    expect(stillActive.data?.revoked_at).toBeNull();
  });

  it("User B cannot see, disable, or delete User A's webhook endpoint (and can't read its signing secret)", async () => {
    const read = await clientB.from("webhook_endpoints").select("id, secret").eq("id", webhookId);
    expect(read.data).toEqual([]);

    await clientB.from("webhook_endpoints").update({ enabled: false }).eq("id", webhookId);
    await clientB.from("webhook_endpoints").delete().eq("id", webhookId);
    const stillThere = await clientA.from("webhook_endpoints").select("id, enabled").eq("id", webhookId).single();
    expect(stillThere.data).toMatchObject({ id: webhookId, enabled: true });
  });

  it("User B cannot read User A's issued dossier signatures", async () => {
    const read = await clientB.from("verification_signatures").select("id").eq("id", signatureId);
    expect(read.data).toEqual([]);
  });

  it("User B cannot read User A's webhook delivery log", async () => {
    const read = await clientB.from("webhook_deliveries").select("id").eq("id", deliveryId);
    expect(read.data).toEqual([]);
  });

  it("neither user can read the other's audit events, and neither can insert a fabricated one directly (writes are service-role only)", async () => {
    const readA = await clientA.from("audit_events").select("id").eq("user_id", userBId);
    expect(readA.data).toEqual([]);

    const fakeInsert = await clientA.from("audit_events").insert({ user_id: userAId, event_type: "sign_in" });
    expect(fakeInsert.error).not.toBeNull();
  });

  it("neither user can read or write the internal rate_limits table directly", async () => {
    const read = await clientA.from("rate_limits").select("key").limit(1);
    expect(read.data).toEqual([]);
    const write = await clientA.from("rate_limits").insert({ key: "test", window_start: new Date().toISOString(), count: 1 });
    expect(write.error).not.toBeNull();
  });
});
