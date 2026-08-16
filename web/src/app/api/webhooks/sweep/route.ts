import { createServiceClient } from "@/lib/supabase/service";
import { attemptDelivery } from "@/lib/webhooks/deliver";
import { pruneExpiredRows } from "@/lib/retention";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 25;

/**
 * Retries deliveries the immediate `after()` attempt (see dispatch.ts)
 * didn't finish successfully, then prunes expired rows from bookkeeping
 * tables (see lib/retention.ts) — one daily cron job doing both rather than
 * two, since Vercel Cron on some plans caps how many jobs a project can
 * schedule at all. Vercel calls this on a schedule (see vercel.json) and
 * automatically sends `Authorization: Bearer $CRON_SECRET` when
 * CRON_SECRET is configured — this route refuses every request when that
 * env var isn't set, rather than running as an open endpoint anyone could
 * use to make this server issue repeated outbound requests.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return Response.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) return Response.json({ error: "Supabase is not configured." }, { status: 503 });

  const nowIso = new Date().toISOString();
  // `next_retry_at IS NULL` covers a delivery that was inserted but whose
  // immediate after() attempt (see dispatch.ts) never got to run at all —
  // without this half of the OR, a delivery that's never been attempted
  // even once would sit in 'pending' forever, since NULL <= anything is
  // never true and so `.lte()` alone silently excludes it.
  const { data: due } = await supabase
    .from("webhook_deliveries")
    .select("id")
    .eq("status", "pending")
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .limit(BATCH_SIZE);

  const attempted = due?.length ?? 0;
  if (attempted > 0) await Promise.all(due!.map((row) => attemptDelivery(supabase, row.id)));

  const pruned = await pruneExpiredRows(supabase);
  return Response.json({ attempted, pruned });
}

// Vercel Cron issues GET by default for scheduled triggers unless a method
// is configured — supporting both keeps this callable either way without
// depending on which one a given Vercel plan/version sends.
export const GET = POST;
