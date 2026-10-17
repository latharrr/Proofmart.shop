-- Security/audit trail. Metadata only — ids, counts, booleans — never
-- document contents, OCR text, or secrets (enforced by every call site, see
-- lib/audit.ts).
--
-- user_id is nullable on purpose: some events (a failed sign-in, a password
-- reset request for an address that may not exist) have no authenticated
-- user to attribute them to.

create table if not exists public.audit_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,

  event_type text not null,
  metadata   jsonb not null default '{}'::jsonb,
  -- Recorded as text, not inet: the value comes from x-forwarded-for and may
  -- be a list or a placeholder, and a malformed header must not fail the
  -- insert of the event it is attached to.
  ip_address text,

  created_at timestamptz not null default now()
);

create index if not exists audit_events_user_created_idx
  on public.audit_events (user_id, created_at desc);
-- The retention sweep deletes by age across all users.
create index if not exists audit_events_created_idx
  on public.audit_events (created_at);

alter table public.audit_events enable row level security;

-- No policies at all, deliberately. This table is written and read only by
-- the service role.
--
-- Not even an owner-read policy: an audit trail a user can read is one they
-- can use to check which of their actions were noticed, and an audit trail a
-- user can write is not evidence of anything. Users who need their own
-- history get it from the documents and webhook-delivery tables, which are
-- theirs by design.
--
-- On delete of a user, events are kept with user_id set to NULL rather than
-- cascaded away, so a security trail survives account deletion.


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
-- No grant to `authenticated` at all: the audit trail is service-role only,
-- which is a stronger statement than "RLS happens to block every row".
grant all on public.audit_events to service_role;
