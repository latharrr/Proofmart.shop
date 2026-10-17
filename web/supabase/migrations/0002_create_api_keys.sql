-- API keys for the public API (/v1/verify, /v1/inspect, /v1/extract).
--
-- Only the sha256 of a key is stored. The raw key is shown to its owner
-- exactly once, at creation, and never persisted or logged (see
-- lib/api-keys.ts). `key_prefix` is the leading, non-secret slice kept so a
-- user can tell their keys apart in a list.
--
-- Authenticating a request means looking a key up by `key_hash` with no
-- session attached, which RLS can never allow — that lookup runs through the
-- service role (lib/api/auth.ts), which bypasses RLS. That is deliberate:
-- there is intentionally no policy that lets an anonymous caller read this
-- table by hash.

create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,

  name         text not null,
  key_prefix   text not null,
  -- Unique so an accidental duplicate is a database error rather than two
  -- keys that authenticate as different users.
  key_hash     text not null unique,

  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  -- Revocation is a timestamp, not a delete: a revoked key stays visible in
  -- the owner's list so they can see it was turned off and when.
  revoked_at   timestamptz
);

-- The hot path: authenticating an inbound API request.
create index if not exists api_keys_key_hash_idx on public.api_keys (key_hash);
create index if not exists api_keys_user_created_idx
  on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

drop policy if exists "api keys are readable by their owner" on public.api_keys;
create policy "api keys are readable by their owner"
  on public.api_keys for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "api keys are insertable by their owner" on public.api_keys;
create policy "api keys are insertable by their owner"
  on public.api_keys for insert to authenticated
  with check (auth.uid() = user_id);

-- Covers revocation (setting revoked_at) and last_used_at bookkeeping.
drop policy if exists "api keys are updatable by their owner" on public.api_keys;
create policy "api keys are updatable by their owner"
  on public.api_keys for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "api keys are deletable by their owner" on public.api_keys;
create policy "api keys are deletable by their owner"
  on public.api_keys for delete to authenticated
  using (auth.uid() = user_id);


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
grant select, insert, update, delete on public.api_keys to authenticated;
grant all on public.api_keys to service_role;
