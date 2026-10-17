-- Fixed-window rate limiting, backed by Postgres.
--
-- Not an external service and not in-memory: on a serverless runtime each
-- invocation can land on a different instance with its own memory, so an
-- in-memory counter would under-count by however many instances are warm.
-- Supabase is already the source of truth for everything else here, so one
-- small table is cheaper than introducing Redis.

create table if not exists public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,

  primary key (key, window_start)
);

-- The retention sweep prunes by window_start (windows are meaningless once
-- they have passed).
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;

-- No policies: this table is internal bookkeeping. It is reached only
-- through check_rate_limit() below, and pruned by the service role.


-- Atomically counts one hit against (key, window_start) and reports whether
-- the caller is still inside the limit.
--
-- The increment and the comparison are a single statement on purpose: doing
-- a SELECT then an UPDATE would let two concurrent requests both read the
-- same count and both decide they were under the limit. ON CONFLICT ... DO
-- UPDATE takes a row lock, so concurrent callers serialize and each one sees
-- its own post-increment value in RETURNING.
--
-- SECURITY DEFINER because rate_limits has no RLS policies — the function is
-- the only sanctioned way in, and it can only ever increment a counter and
-- return a boolean.
create or replace function public.check_rate_limit(
  p_key          text,
  p_window_start timestamptz,
  p_limit        integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  -- `rate_limits.count` (not `public.rate_limits.count`): inside ON CONFLICT
  -- DO UPDATE the target row is in scope under the bare relation name, and
  -- the schema-qualified form is not a valid reference there.
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start)
    do update set count = rl.count + 1
  returning rl.count into new_count;

  return new_count <= p_limit;
end;
$$;

-- The app calls this through the service role, but granting execute to the
-- ordinary roles keeps the function usable from a user session too without
-- opening up the table behind it.
grant execute on function public.check_rate_limit(text, timestamptz, integer)
  to anon, authenticated, service_role;


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
-- Internal bookkeeping: reachable only through check_rate_limit() above.
grant all on public.rate_limits to service_role;
