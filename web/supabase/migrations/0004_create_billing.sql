-- Billing: which plan a user is on, and what they have spent this month.
--
-- Both tables are written only by the service role. A user may read their
-- own rows (that is what /account/billing shows) but may not write them —
-- a self-writable subscriptions row is a free upgrade to Pro, and a
-- self-deletable usage event is a free quota reset.

create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  -- Unique: the billing code upserts on user_id (one subscription per user).
  user_id              uuid not null unique references auth.users (id) on delete cascade,

  plan                 text not null default 'free' check (plan in ('free', 'pro')),
  status               text not null default 'active'
                         check (status in ('active', 'past_due', 'cancelled')),
  razorpay_customer_id text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions are readable by their owner" on public.subscriptions;
create policy "subscriptions are readable by their owner"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();


-- One row per metered public-API call. checkUsageQuota counts the rows for
-- the current calendar month, so this table IS the usage meter — there is no
-- separate counter to drift out of sync with it.
create table if not exists public.api_usage_events (
  id         uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys (id) on delete set null,
  user_id    uuid not null references auth.users (id) on delete cascade,

  event_type text not null
               check (event_type in ('verify_request', 'inspect_request', 'extract_request')),

  created_at timestamptz not null default now()
);

-- The quota query: this user's metered events since the start of the month.
create index if not exists api_usage_events_user_created_idx
  on public.api_usage_events (user_id, created_at desc);

alter table public.api_usage_events enable row level security;

drop policy if exists "usage events are readable by their owner" on public.api_usage_events;
create policy "usage events are readable by their owner"
  on public.api_usage_events for select to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policy: metering is service-role only.


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

grant select on public.api_usage_events to authenticated;
grant all on public.api_usage_events to service_role;
