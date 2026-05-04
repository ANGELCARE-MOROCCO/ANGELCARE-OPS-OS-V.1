-- HR V2 Sync Stability UI Polish
-- Safe compatibility patch. Does not drop existing HR backbone.

create extension if not exists pgcrypto;

create table if not exists public.hr_sync_events (
  id uuid primary key default gen_random_uuid(),
  source_module text not null,
  source_table text,
  source_id uuid,
  staff_user_id uuid,
  event_type text not null default 'sync_check',
  status text not null default 'open',
  severity text not null default 'normal',
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_page_action_logs (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  action_key text not null,
  entity_type text,
  entity_id uuid,
  status text not null default 'recorded',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_bulk_operation_batches (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  operation_type text not null,
  target_count int not null default 0,
  status text not null default 'draft',
  preview_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.hr_positions add column if not exists active boolean not null default true;
alter table if exists public.hr_positions add column if not exists permissions text[] default '{}';
alter table if exists public.hr_positions add column if not exists ui_priority int default 50;
alter table if exists public.hr_departments add column if not exists ui_priority int default 50;
alter table if exists public.hr_staff_profiles add column if not exists operational_status text default 'active';
alter table if exists public.hr_staff_profiles add column if not exists execution_notes text;
alter table if exists public.hr_rosters add column if not exists conflict_flag boolean default false;
alter table if exists public.hr_rosters add column if not exists coverage_status text default 'scheduled';

create index if not exists hr_sync_events_staff_idx on public.hr_sync_events(staff_user_id);
create index if not exists hr_sync_events_status_idx on public.hr_sync_events(status);
create index if not exists hr_page_action_logs_page_idx on public.hr_page_action_logs(page_key);
create index if not exists hr_bulk_operation_batches_status_idx on public.hr_bulk_operation_batches(status);
