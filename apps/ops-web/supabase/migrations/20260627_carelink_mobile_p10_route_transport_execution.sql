-- CareLink Mobile P10 Route & Transport Execution
-- Additive mobile route execution layer only. CARELINK-OPS route/dossier data remains the source of truth.

create extension if not exists pgcrypto;

create table if not exists public.carelink_mission_route_execution_logs (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null,
  caregiver_id bigint not null,
  route_id text not null default 'primary-route',
  route_code text,
  action text not null,
  status text not null default 'recorded',
  transport_mode text,
  eta text,
  location_snapshot jsonb not null default '{}'::jsonb,
  route_snapshot jsonb not null default '{}'::jsonb,
  allowance_claim jsonb not null default '{}'::jsonb,
  notes text,
  issue_severity text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carelink_route_execution_action_check check (action in (
    'departure_confirmed',
    'eta_updated',
    'delay_reported',
    'issue_reported',
    'route_completed',
    'allowance_claimed',
    'location_shared',
    'route_update'
  )),
  constraint carelink_route_execution_status_check check (status in ('recorded', 'started', 'submitted', 'attention_required', 'completed', 'cancelled'))
);

create index if not exists carelink_route_execution_mission_idx
  on public.carelink_mission_route_execution_logs (mission_id, caregiver_id, created_at desc);

create index if not exists carelink_route_execution_route_idx
  on public.carelink_mission_route_execution_logs (mission_id, route_id, action, created_at desc);

create index if not exists carelink_route_execution_status_idx
  on public.carelink_mission_route_execution_logs (status, action, updated_at desc);

alter table public.carelink_mission_route_execution_logs enable row level security;

drop policy if exists "carelink route execution caregiver read" on public.carelink_mission_route_execution_logs;
create policy "carelink route execution caregiver read" on public.carelink_mission_route_execution_logs
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_route_execution_logs.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink route execution caregiver insert" on public.carelink_mission_route_execution_logs;
create policy "carelink route execution caregiver insert" on public.carelink_mission_route_execution_logs
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_route_execution_logs.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

comment on table public.carelink_mission_route_execution_logs is 'CareLink Mobile P10: route and transport execution logs recorded by assigned mobile caregivers against OPS mission route/dossier data.';
