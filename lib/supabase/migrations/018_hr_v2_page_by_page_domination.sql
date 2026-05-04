-- HR V2 PAGE-BY-PAGE DOMINATION COMPATIBILITY PATCH
-- Safe migration: adds operational columns/tables only if missing. Does not drop existing data.

create extension if not exists pgcrypto;

alter table if exists public.hr_positions add column if not exists permissions text[] default '{}';
alter table if exists public.hr_positions add column if not exists active boolean not null default true;
alter table if exists public.hr_positions add column if not exists sort_order int default 0;

alter table if exists public.hr_departments add column if not exists active boolean not null default true;
alter table if exists public.hr_departments add column if not exists sort_order int default 0;

alter table if exists public.hr_staff_profiles add column if not exists manager_user_id uuid;
alter table if exists public.hr_staff_profiles add column if not exists employment_status text default 'active';
alter table if exists public.hr_staff_profiles add column if not exists emergency_contact text;
alter table if exists public.hr_staff_profiles add column if not exists profile_completion int default 0;
alter table if exists public.hr_staff_profiles add column if not exists last_hr_action_at timestamptz;

create table if not exists public.hr_bulk_action_batches (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  action_type text not null,
  target_type text default 'staff',
  target_ids uuid[] default '{}',
  status text default 'draft',
  preview jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_manual_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  title text not null,
  status text default 'open',
  current_step text,
  payload jsonb not null default '{}'::jsonb,
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_action_comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  comment text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_ui_audit_events (
  id uuid primary key default gen_random_uuid(),
  page_key text,
  action_key text,
  actor_user_id uuid,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hr_bulk_action_batches_status_idx on public.hr_bulk_action_batches(status);
create index if not exists hr_manual_workflow_runs_status_idx on public.hr_manual_workflow_runs(status);
create index if not exists hr_ui_audit_events_page_key_idx on public.hr_ui_audit_events(page_key);
