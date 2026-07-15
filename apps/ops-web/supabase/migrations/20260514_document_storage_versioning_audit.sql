-- ANGELCARE RCC MEGA HARDENING PACK 02
-- DOCUMENT STORAGE + VERSIONING + AUDIT
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('revenue-documents', 'revenue-documents', false)
on conflict (id) do nothing;

create table if not exists public.revenue_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid,
  entity_type text not null default 'prospect',
  entity_id text not null,
  title text not null,
  storage_bucket text not null default 'revenue-documents',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  version integer not null default 1,
  status text not null default 'active',
  uploaded_by text not null default 'AngelCare',
  created_at timestamptz not null default now()
);

create index if not exists revenue_document_versions_entity_idx on public.revenue_document_versions(entity_type, entity_id, created_at desc);
create index if not exists revenue_document_versions_document_idx on public.revenue_document_versions(document_id, version desc);

alter table public.revenue_document_versions enable row level security;

drop policy if exists authenticated_all_revenue_document_versions on public.revenue_document_versions;
create policy authenticated_all_revenue_document_versions on public.revenue_document_versions for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_revenue_documents_storage on storage.objects;
create policy authenticated_all_revenue_documents_storage
on storage.objects
for all
to authenticated
using (bucket_id = 'revenue-documents')
with check (bucket_id = 'revenue-documents');

create or replace function public.revenue_log_document_version_event()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    perform public.revenue_log_event(new.entity_type, new.entity_id, 'document.version_uploaded', 'Document version uploaded', new.title || ' v' || new.version, new.uploaded_by, 'info', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    perform public.revenue_log_event(new.entity_type, new.entity_id, 'document.version_updated', 'Document version updated', new.title || ' v' || new.version, new.uploaded_by, 'info', to_jsonb(new));
  elsif tg_op = 'DELETE' then
    perform public.revenue_log_event(old.entity_type, old.entity_id, 'document.version_deleted', 'Document version deleted', old.title || ' v' || old.version, old.uploaded_by, 'warning', to_jsonb(old));
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_revenue_document_version_events on public.revenue_document_versions;
create trigger trg_revenue_document_version_events after insert or update or delete on public.revenue_document_versions
for each row execute function public.revenue_log_document_version_event();

create or replace view public.revenue_document_command_view as
select
  d.*,
  coalesce(p.name, d.entity_id) as entity_name,
  coalesce(p.city, 'Unassigned') as entity_city
from public.revenue_document_versions d
left join public.revenue_prospects p on p.id = d.entity_id;
