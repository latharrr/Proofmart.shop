-- One row per issued dossier signature.
--
-- `id` IS the verificationId embedded in the signed payload and printed on
-- the dossier, which is why it is supplied by the application rather than
-- always defaulted — /v1/verify-signature looks a signature up by exactly
-- that id plus its key_id. The default exists so a bare insert is still
-- legal.
--
-- Re-downloading a dossier mints a new row (a new verificationId and a fresh
-- signature); rows are never updated in place, so there is no update policy.

create table if not exists public.verification_signatures (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.documents (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,

  -- sha256 of the bytes the signature vouches for. Copied from the document
  -- row rather than recomputed, so the two can never disagree.
  document_hash  text not null,
  engine_version text not null,
  verdict        text not null check (verdict in ('CLEAR', 'REVIEW', 'FAIL', 'INCONCLUSIVE')),
  -- The exact canonicalized payload that was signed (see
  -- lib/signing/canonicalize.ts). Kept verbatim: re-deriving it later and
  -- getting a byte different would make a valid signature look invalid.
  payload        jsonb not null default '{}'::jsonb,

  signature      text not null,
  algorithm      text not null default 'ed25519',
  -- Fingerprint of the public key used, so a rotated key pair can still
  -- verify signatures issued under the previous one.
  key_id         text not null,

  created_at     timestamptz not null default now()
);

create index if not exists verification_signatures_document_idx
  on public.verification_signatures (document_id);
-- The public verification lookup: by id and the key that signed it.
create index if not exists verification_signatures_id_key_idx
  on public.verification_signatures (id, key_id);

alter table public.verification_signatures enable row level security;

drop policy if exists "signatures are readable by their owner" on public.verification_signatures;
create policy "signatures are readable by their owner"
  on public.verification_signatures for select to authenticated
  using (auth.uid() = user_id);

-- The dossier route signs and inserts as the signed-in user, not as the
-- service role, so this insert policy is load-bearing.
drop policy if exists "signatures are insertable by their owner" on public.verification_signatures;
create policy "signatures are insertable by their owner"
  on public.verification_signatures for insert to authenticated
  with check (auth.uid() = user_id);

-- Public signature verification (/v1/verify-signature) has no session at
-- all and reads through the service role, which bypasses RLS. There is
-- deliberately no anonymous read policy: confirming a signature you already
-- hold must not also let you enumerate everyone else's.


-- Explicit privileges. Supabase grants these to new public tables by default,
-- but a schema applied by hand (SQL editor, a fresh branch, a self-hosted
-- instance) can land without them, and the failure mode is a confusing
-- "permission denied for table" that looks like an RLS bug. RLS still decides
-- which *rows* each role may touch; these decide whether the role may reach
-- the table at all.
grant select, insert on public.verification_signatures to authenticated;
grant all on public.verification_signatures to service_role;
