-- ANGELCARE Email OS — additive attachment transport integrity
-- No destructive operations. Apply once through the controlled Supabase migration path.

alter table if exists public.email_os_core_compose_attachments
  add column if not exists mailbox_id text,
  add column if not exists storage_file_id text,
  add column if not exists storage_bucket text,
  add column if not exists storage_key text,
  add column if not exists source text default 'storage',
  add column if not exists sha256_hash text,
  add column if not exists updated_at timestamptz default now();

create index if not exists email_os_core_compose_attachments_draft_idx
  on public.email_os_core_compose_attachments (draft_id);

create index if not exists email_os_core_compose_attachments_outbox_idx
  on public.email_os_core_compose_attachments (outbox_id);

create index if not exists email_os_core_compose_attachments_mailbox_idx
  on public.email_os_core_compose_attachments (mailbox_id);

create index if not exists email_os_core_compose_attachments_storage_file_idx
  on public.email_os_core_compose_attachments (storage_file_id);

create unique index if not exists email_os_core_compose_attachments_draft_storage_uidx
  on public.email_os_core_compose_attachments (draft_id, storage_file_id)
  where draft_id is not null and storage_file_id is not null;

create unique index if not exists email_os_core_compose_attachments_outbox_storage_uidx
  on public.email_os_core_compose_attachments (outbox_id, storage_file_id)
  where outbox_id is not null and storage_file_id is not null;

update public.email_os_core_compose_attachments
set
  storage_file_id = coalesce(
    storage_file_id,
    nullif(metadata->>'storageFileId', ''),
    nullif(metadata->>'fileId', ''),
    nullif(metadata->>'storage_file_id', '')
  ),
  storage_bucket = coalesce(
    storage_bucket,
    nullif(metadata->>'storageBucket', ''),
    nullif(metadata->>'storage_bucket', '')
  ),
  storage_key = coalesce(
    storage_key,
    nullif(metadata->>'storageKey', ''),
    nullif(metadata->>'storage_key', '')
  ),
  sha256_hash = coalesce(
    sha256_hash,
    nullif(metadata->>'sha256Hash', ''),
    nullif(metadata->>'sha256_hash', '')
  ),
  source = coalesce(nullif(source, ''), case when coalesce(metadata->>'storageFileId', metadata->>'fileId', '') <> '' then 'storage' else 'legacy_inline' end),
  updated_at = coalesce(updated_at, created_at, now())
where
  storage_file_id is null
  or storage_bucket is null
  or storage_key is null
  or sha256_hash is null
  or source is null
  or updated_at is null;
