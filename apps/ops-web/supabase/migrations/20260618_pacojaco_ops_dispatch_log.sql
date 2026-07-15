-- PACOJACO OPS dispatch logging extension
-- Additive migration for document email / WhatsApp / download / print tracking.

create extension if not exists pgcrypto;

create table if not exists public.pacojaco_document_dispatches (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.pacojaco_documents(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'download', 'print')),
  recipient text null,
  status text not null default 'pending',
  message text null,
  error text null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists pacojaco_document_dispatches_document_id_idx on public.pacojaco_document_dispatches(document_id);
create index if not exists pacojaco_document_dispatches_channel_idx on public.pacojaco_document_dispatches(channel);
create index if not exists pacojaco_document_dispatches_status_idx on public.pacojaco_document_dispatches(status);
create index if not exists pacojaco_document_dispatches_created_at_idx on public.pacojaco_document_dispatches(created_at);

alter table public.pacojaco_document_dispatches enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pacojaco_document_dispatches'
      and policyname = 'authenticated_all_pacojaco_document_dispatches'
  ) then
    create policy authenticated_all_pacojaco_document_dispatches
      on public.pacojaco_document_dispatches
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;

