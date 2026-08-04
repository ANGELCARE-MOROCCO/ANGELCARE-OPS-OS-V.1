begin;

alter table public.ac_whatsapp_attachments
  add column if not exists storage_host text,
  add column if not exists verified_at timestamptz,
  add column if not exists migration_status text;

update public.ac_whatsapp_attachments
set migration_status = case
  when storage_provider = 'windows' then 'ready'
  when storage_provider = 'supabase' then 'legacy_supabase'
  when storage_provider = 'openwa' then 'pending_ingest'
  else coalesce(migration_status, 'legacy')
end
where migration_status is null;

create index if not exists ac_whatsapp_attachments_storage_provider_idx
  on public.ac_whatsapp_attachments(storage_provider, migration_status);

create index if not exists ac_whatsapp_attachments_storage_path_idx
  on public.ac_whatsapp_attachments(storage_path)
  where storage_path is not null;

create table if not exists public.ac_whatsapp_media_vault_events (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid references public.ac_whatsapp_attachments(id) on delete set null,
  event_type text not null,
  status text not null default 'recorded',
  storage_provider text,
  storage_path text,
  checksum text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ac_whatsapp_media_vault_events_attachment_idx
  on public.ac_whatsapp_media_vault_events(attachment_id, created_at desc);

alter table public.ac_whatsapp_media_vault_events enable row level security;

commit;
