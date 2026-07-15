-- CareLink Mobile P9 Mission Brief & Parent Instructions Acknowledgement
-- Additive mobile acknowledgement layer only. CARELINK-OPS mission dossier remains the source of truth.

create extension if not exists pgcrypto;

create table if not exists public.carelink_mission_brief_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null,
  caregiver_id bigint not null,
  status text not null default 'acknowledged',
  brief_version text not null default 'carelink-mobile-brief-v1',
  sections jsonb not null default '{}'::jsonb,
  brief_snapshot jsonb not null default '{}'::jsonb,
  parent_instructions_acknowledged boolean not null default false,
  service_scope_acknowledged boolean not null default false,
  location_acknowledged boolean not null default false,
  emergency_acknowledged boolean not null default false,
  confidentiality_acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carelink_brief_ack_status_check check (status in ('pending', 'acknowledged', 'revoked'))
);

create unique index if not exists carelink_mission_brief_ack_unique
  on public.carelink_mission_brief_acknowledgements (mission_id, caregiver_id);

create index if not exists carelink_mission_brief_ack_mission_idx
  on public.carelink_mission_brief_acknowledgements (mission_id, caregiver_id, acknowledged_at desc);

create index if not exists carelink_mission_brief_ack_status_idx
  on public.carelink_mission_brief_acknowledgements (status, updated_at desc);

alter table public.carelink_mission_brief_acknowledgements enable row level security;

drop policy if exists "carelink mission brief caregiver read" on public.carelink_mission_brief_acknowledgements;
create policy "carelink mission brief caregiver read" on public.carelink_mission_brief_acknowledgements
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_brief_acknowledgements.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink mission brief caregiver insert" on public.carelink_mission_brief_acknowledgements;
create policy "carelink mission brief caregiver insert" on public.carelink_mission_brief_acknowledgements
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_brief_acknowledgements.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink mission brief caregiver update" on public.carelink_mission_brief_acknowledgements;
create policy "carelink mission brief caregiver update" on public.carelink_mission_brief_acknowledgements
for update to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_brief_acknowledgements.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
)
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id::text = carelink_mission_brief_acknowledgements.caregiver_id::text
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

comment on table public.carelink_mission_brief_acknowledgements is 'CareLink Mobile P9: agent acknowledgement of mission brief, parent instructions, location, emergency contact and confidentiality before mission start.';
