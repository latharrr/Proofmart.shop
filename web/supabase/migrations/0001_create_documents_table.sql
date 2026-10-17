-- Saved verification history for signed-in users.
--
-- `result` stores /v1/verify's response envelope verbatim (see
-- lib/api/envelope.ts) rather than a re-derived shape, so a saved document
-- renders exactly the way a live one does — that is the whole reason this
-- column is jsonb and not a set of flattened columns.
--
-- Only user_id, filename, size_bytes and status are required at insert time:
-- a row is created the moment an upload starts, before anything is known
-- about the document, and filled in as processing completes.

create table if not exists public.documents (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,

  filename             text not null,
  size_bytes           bigint not null,
  status               text not null default 'processing'
                         check (status in ('processing', 'ready', 'error')),

  verdict              text check (verdict in ('CLEAR', 'REVIEW', 'FAIL', 'INCONCLUSIVE')),
  document_kind        text,
  pdf_type             text,
  page_count           integer,
  findings_count       integer not null default 0,
  result               jsonb,

  error_code           text,
  error_message        text,

  -- Which engine produced `result`. Defaulted so a bare insert (an upload
  -- that has not been processed yet) is legal; the app always sets it
  -- explicitly from VERIFICATION_ENGINE_VERSION.
  verification_version text not null default 'unknown',

  -- Vercel Blob pathname of the stored PDF, or NULL when no file was kept
  -- (anonymous/direct uploads, and every failed upload — see
  -- failedDocumentInsert, which never stores a file).
  storage_pathname     text,
  -- sha256 of the exact bytes verified. This is the identity a dossier
  -- signature vouches for, so it must come from the buffer in hand at
  -- persistence time, never re-derived later.
  document_hash        text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- The documents list is always "mine, newest first".
create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents are readable by their owner" on public.documents;
create policy "documents are readable by their owner"
  on public.documents for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "documents are insertable by their owner" on public.documents;
create policy "documents are insertable by their owner"
  on public.documents for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "documents are updatable by their owner" on public.documents;
create policy "documents are updatable by their owner"
  on public.documents for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "documents are deletable by their owner" on public.documents;
create policy "documents are deletable by their owner"
  on public.documents for delete to authenticated
  using (auth.uid() = user_id);

-- Keeps updated_at honest without every call site remembering to set it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
