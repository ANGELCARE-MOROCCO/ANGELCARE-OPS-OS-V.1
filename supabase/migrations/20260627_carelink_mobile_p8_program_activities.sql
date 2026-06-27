-- CareLink Mobile P8 Mission Program / Activities Execution
-- Additive mobile execution layer only. CARELINK-OPS dossier/program source remains unchanged.

create extension if not exists pgcrypto;

create table if not exists public.carelink_mission_program_activity_logs (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null,
  caregiver_id bigint not null,
  activity_id text not null,
  activity_label text not null,
  status text not null default 'pending',
  notes text,
  issue_severity text,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carelink_program_activity_status_check check (status in ('pending', 'started', 'in_progress', 'completed', 'done', 'validated', 'issue', 'blocked', 'skipped'))
);

create unique index if not exists carelink_program_activity_unique
  on public.carelink_mission_program_activity_logs (mission_id, caregiver_id, activity_id);

create index if not exists carelink_program_activity_mission_idx
  on public.carelink_mission_program_activity_logs (mission_id, caregiver_id, updated_at desc);

create index if not exists carelink_program_activity_status_idx
  on public.carelink_mission_program_activity_logs (status, updated_at desc);

alter table public.carelink_mission_program_activity_logs enable row level security;

drop policy if exists "carelink program activities caregiver read" on public.carelink_mission_program_activity_logs;
create policy "carelink program activities caregiver read" on public.carelink_mission_program_activity_logs
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_program_activity_logs.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink program activities caregiver insert" on public.carelink_mission_program_activity_logs;
create policy "carelink program activities caregiver insert" on public.carelink_mission_program_activity_logs
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_program_activity_logs.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink program activities caregiver update" on public.carelink_mission_program_activity_logs;
create policy "carelink program activities caregiver update" on public.carelink_mission_program_activity_logs
for update to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_program_activity_logs.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
)
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_program_activity_logs.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

comment on table public.carelink_mission_program_activity_logs is 'CareLink Mobile P8: agent-side execution status for mission dossier program/activity lines.';
