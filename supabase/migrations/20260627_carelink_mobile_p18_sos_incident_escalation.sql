-- CARELINK P18 — SOS / Incident Real-Time Escalation
-- Scope: mobile emergency event ledger, critical escalation, dispatch notification foundation.

create table if not exists public.carelink_mobile_sos_events (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  mission_id bigint null,
  auth_user_id text null,
  emergency_type text not null default 'sos',
  severity text not null default 'critical',
  status text not null default 'open',
  note text null,
  callback_requested boolean not null default false,
  replacement_requested boolean not null default false,
  location_snapshot jsonb not null default '{}'::jsonb,
  device_snapshot jsonb not null default '{}'::jsonb,
  alert_id text null,
  escalation_id text null,
  dispatch_thread_key text null,
  source text not null default 'carelink_mobile',
  metadata jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carelink_mobile_sos_events_caregiver_idx on public.carelink_mobile_sos_events (caregiver_id, created_at desc);
create index if not exists carelink_mobile_sos_events_mission_idx on public.carelink_mobile_sos_events (mission_id, created_at desc);
create index if not exists carelink_mobile_sos_events_status_idx on public.carelink_mobile_sos_events (status, severity, created_at desc);

alter table public.carelink_mobile_sos_events enable row level security;

drop policy if exists "carelink mobile sos caregiver read" on public.carelink_mobile_sos_events;
create policy "carelink mobile sos caregiver read"
  on public.carelink_mobile_sos_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_mobile_sos_events.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink mobile sos caregiver insert" on public.carelink_mobile_sos_events;
create policy "carelink mobile sos caregiver insert"
  on public.carelink_mobile_sos_events
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_mobile_sos_events.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink mobile sos authenticated write" on public.carelink_mobile_sos_events;
create policy "carelink mobile sos authenticated write"
  on public.carelink_mobile_sos_events
  for all
  to authenticated
  using (true)
  with check (true);
