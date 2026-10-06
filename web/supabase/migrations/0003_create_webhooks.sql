-- Webhook endpoints and their delivery log.
--
-- Split deliberately: an endpoint is user-owned configuration, a delivery is
-- an operational record the *system* writes. That split is why the two
-- tables have different policies — see the note above webhook_deliveries.

create table if not exists public.webhook_endpoints (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,

  url        text not null,
  -- HMAC signing secret for this endpoint (see lib/webhooks/hmac.ts). Shown
  -- to the owner once at creation; readable only by them thereafter.
  secret     text not null,
  enabled    boolean not null default true,

  created_at timestamptz not null default now()
);

create index if not exists webhook_endpoints_user_idx
  on public.webhook_endpoints (user_id, created_at desc);
-- dispatch.ts fans out to every enabled endpoint for a user.
create index if not exists webhook_endpoints_user_enabled_idx
  on public.webhook_endpoints (user_id) where enabled;

alter table public.webhook_endpoints enable row level security;

drop policy if exists "webhook endpoints are readable by their owner" on public.webhook_endpoints;
create policy "webhook endpoints are readable by their owner"
  on public.webhook_endpoints for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "webhook endpoints are insertable by their owner" on public.webhook_endpoints;
create policy "webhook endpoints are insertable by their owner"
  on public.webhook_endpoints for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "webhook endpoints are updatable by their owner" on public.webhook_endpoints;
create policy "webhook endpoints are updatable by their owner"
  on public.webhook_endpoints for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "webhook endpoints are deletable by their owner" on public.webhook_endpoints;
create policy "webhook endpoints are deletable by their owner"
  on public.webhook_endpoints for delete to authenticated
  using (auth.uid() = user_id);


-- One row per (endpoint, event). Created by dispatch.ts, then updated in
-- place by each delivery attempt — the immediate one and every retry — so
-- the row is both the queue entry and the audit record.
--
-- `verification_id` is text, not uuid: it carries whatever id the emitting
-- event used, which is not always a database uuid.
create table if not exists public.webhook_deliveries (
  id                   uuid primary key default gen_random_uuid(),
  webhook_endpoint_id  uuid not null references public.webhook_endpoints (id) on delete cascade,
  user_id              uuid not null references auth.users (id) on delete cascade,

  event_type           text not null,
  verification_id      text,
  payload              jsonb not null default '{}'::jsonb,

  status               text not null default 'pending'
                         check (status in ('pending', 'success', 'failed', 'exhausted')),
  attempt_count        integer not null default 0,
  last_attempted_at    timestamptz,
  last_response_status integer,
  last_error           text,
  -- NULL means "not scheduled": either never attempted yet, or terminal.
  -- The sweep treats NULL as due — see the comment in /api/webhooks/sweep.
  next_retry_at        timestamptz,

  created_at           timestamptz not null default now()
);

-- The sweep's query: pending rows that are due.
create index if not exists webhook_deliveries_due_idx
  on public.webhook_deliveries (next_retry_at) where status = 'pending';
create index if not exists webhook_deliveries_user_created_idx
  on public.webhook_deliveries (user_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

-- Read-only for the owner: /account/webhooks shows recent delivery history.
drop policy if exists "webhook deliveries are readable by their owner" on public.webhook_deliveries;
create policy "webhook deliveries are readable by their owner"
  on public.webhook_deliveries for select to authenticated
  using (auth.uid() = user_id);

-- There is deliberately NO insert/update/delete policy here. Delivery rows
-- are written only by the service role (dispatch.ts, deliver.ts, the retry
-- sweep). If a user could forge or edit a delivery record, the delivery log
-- would stop being evidence of what the system actually sent.


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
grant select, insert, update, delete on public.webhook_endpoints to authenticated;
grant all on public.webhook_endpoints to service_role;

-- Owners read their delivery history; only the service role writes it.
grant select on public.webhook_deliveries to authenticated;
grant all on public.webhook_deliveries to service_role;
