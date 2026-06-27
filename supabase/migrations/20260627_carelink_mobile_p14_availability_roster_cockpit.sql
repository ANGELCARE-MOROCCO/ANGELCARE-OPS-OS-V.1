-- CARELINK P14 — Availability & Roster Cockpit
-- Scope: mobile agent availability/roster declarations, blackout/day-off, emergency/weekend/night/transport readiness.

alter table if exists public.carelink_agent_availability_updates
  add column if not exists availability_type text not null default 'status_update',
  add column if not exists preferred_zones jsonb not null default '[]'::jsonb,
  add column if not exists excluded_zones jsonb not null default '[]'::jsonb,
  add column if not exists blackout_date date null,
  add column if not exists day_part text null,
  add column if not exists weekend_available boolean null,
  add column if not exists night_available boolean null,
  add column if not exists emergency_available boolean null,
  add column if not exists transport_ready boolean null,
  add column if not exists conflict_level text null,
  add column if not exists reviewed_by text null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists review_status text not null default 'pending_ops_visibility';

create index if not exists carelink_availability_updates_type_idx on public.carelink_agent_availability_updates (caregiver_id, availability_type, created_at desc);
create index if not exists carelink_availability_updates_blackout_idx on public.carelink_agent_availability_updates (caregiver_id, blackout_date);
create index if not exists carelink_availability_updates_effective_idx on public.carelink_agent_availability_updates (caregiver_id, effective_from, effective_until);
create index if not exists carelink_availability_updates_conflict_idx on public.carelink_agent_availability_updates (conflict_level, created_at desc);

-- RLS is already enabled by P7. Re-assert safe caregiver policies without invalid policy creation syntax.

alter table public.carelink_agent_availability_updates enable row level security;

drop policy if exists "carelink availability p14 caregiver read" on public.carelink_agent_availability_updates;
create policy "carelink availability p14 caregiver read"
  on public.carelink_agent_availability_updates
  for select
  to authenticated
  using (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_agent_availability_updates.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink availability p14 caregiver insert" on public.carelink_agent_availability_updates;
create policy "carelink availability p14 caregiver insert"
  on public.carelink_agent_availability_updates
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_agent_availability_updates.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );
