-- AngelCare Revenue Command Center: browser localStorage recovery + permanent persistence
-- Run this once in Supabase SQL editor before pressing "Import recovered revenue data" in the app.

create extension if not exists pgcrypto;

create table if not exists public.revenue_command_records (
  id uuid primary key default gen_random_uuid(),
  module_key text not null default 'hq',
  page_key text not null default 'revenue-command-center',
  record_type text not null default 'command_record',
  title text not null default 'Revenue command record',
  description text,
  owner_name text,
  department text default 'Revenue Command',
  status text default 'open',
  priority text default 'medium',
  risk_level text default 'low',
  value_mad numeric default 0,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  escalated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_command_records add column if not exists module_key text default 'hq';
alter table public.revenue_command_records add column if not exists page_key text default 'revenue-command-center';
alter table public.revenue_command_records add column if not exists record_type text default 'command_record';
alter table public.revenue_command_records add column if not exists title text default 'Revenue command record';
alter table public.revenue_command_records add column if not exists description text;
alter table public.revenue_command_records add column if not exists owner_name text;
alter table public.revenue_command_records add column if not exists department text default 'Revenue Command';
alter table public.revenue_command_records add column if not exists status text default 'open';
alter table public.revenue_command_records add column if not exists priority text default 'medium';
alter table public.revenue_command_records add column if not exists risk_level text default 'low';
alter table public.revenue_command_records add column if not exists value_mad numeric default 0;
alter table public.revenue_command_records add column if not exists due_at timestamptz;
alter table public.revenue_command_records add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_command_records add column if not exists created_at timestamptz not null default now();
alter table public.revenue_command_records add column if not exists updated_at timestamptz not null default now();
alter table public.revenue_command_records add column if not exists deleted_at timestamptz;

create table if not exists public.revenue_command_localstorage_backups (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  source_label text not null default 'staff_browser_recovery',
  payload jsonb not null,
  imported_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_command_recovered_entities (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null,
  storage_key text not null,
  module_key text not null,
  entity_type text not null,
  external_id text not null,
  title text not null,
  payload jsonb not null,
  central_record_id uuid references public.revenue_command_records(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(batch_key, storage_key, entity_type, external_id)
);

create table if not exists public.revenue_command_action_logs (
  id uuid primary key default gen_random_uuid(),
  module_key text default 'revenue-command-center',
  page_key text default 'revenue-command-center',
  action_key text not null,
  selected_count int default 0,
  payload jsonb not null default '{}'::jsonb,
  status text default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists revenue_command_records_live_idx on public.revenue_command_records(module_key, status, priority, updated_at desc) where deleted_at is null;
create index if not exists revenue_command_records_metadata_gin_idx on public.revenue_command_records using gin(metadata);
create index if not exists revenue_command_recovered_entities_lookup_idx on public.revenue_command_recovered_entities(module_key, entity_type, updated_at desc);

-- Safe RLS posture for authenticated staff. Adjust if you use stricter role policies.
alter table public.revenue_command_records enable row level security;
alter table public.revenue_command_localstorage_backups enable row level security;
alter table public.revenue_command_recovered_entities enable row level security;
alter table public.revenue_command_action_logs enable row level security;

do $$ begin
  create policy "Authenticated staff can read revenue records" on public.revenue_command_records for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can write revenue records" on public.revenue_command_records for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can read recovery backups" on public.revenue_command_localstorage_backups for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can write recovery backups" on public.revenue_command_localstorage_backups for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can read recovered entities" on public.revenue_command_recovered_entities for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can write recovered entities" on public.revenue_command_recovered_entities for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can read action logs" on public.revenue_command_action_logs for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated staff can write action logs" on public.revenue_command_action_logs for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
