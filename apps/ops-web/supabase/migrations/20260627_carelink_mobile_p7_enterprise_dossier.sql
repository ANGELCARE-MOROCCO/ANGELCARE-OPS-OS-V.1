-- CareLink Mobile P7 Enterprise Agent Dossier / UIX sync foundation
-- Additive only: no OPS UI changes and no existing mission workflow rewrite.

create extension if not exists pgcrypto;

create table if not exists public.carelink_agent_profile_requests (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  auth_user_id text,
  request_type text not null default 'profile_correction',
  message text not null,
  requested_changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending_ops_review',
  source text not null default 'carelink_mobile',
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carelink_agent_policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  auth_user_id text,
  policy_key text not null,
  policy_version text not null default '2026.06',
  status text not null default 'acknowledged',
  acknowledged_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carelink_policy_ack_unique unique (caregiver_id, policy_key, policy_version)
);

create table if not exists public.carelink_agent_availability_updates (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  auth_user_id text,
  mission_id bigint,
  availability_status text not null default 'available',
  note text,
  source text not null default 'carelink_mobile',
  effective_from timestamptz,
  effective_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carelink_agent_presence_events (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  auth_user_id text,
  mission_id bigint,
  event_type text not null,
  note text,
  device_fingerprint text,
  source text not null default 'carelink_mobile',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.carelink_agent_document_submissions (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  auth_user_id text,
  document_type text not null,
  file_url text,
  note text,
  status text not null default 'submitted_for_ops_review',
  review_status text not null default 'pending_ops_review',
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  source text not null default 'carelink_mobile',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carelink_agent_profile_requests_caregiver_idx on public.carelink_agent_profile_requests (caregiver_id, created_at desc);
create index if not exists carelink_agent_policy_ack_caregiver_idx on public.carelink_agent_policy_acknowledgements (caregiver_id, acknowledged_at desc);
create index if not exists carelink_agent_availability_caregiver_idx on public.carelink_agent_availability_updates (caregiver_id, created_at desc);
create index if not exists carelink_agent_presence_caregiver_idx on public.carelink_agent_presence_events (caregiver_id, created_at desc);
create index if not exists carelink_agent_document_submissions_caregiver_idx on public.carelink_agent_document_submissions (caregiver_id, created_at desc);

alter table public.carelink_agent_profile_requests enable row level security;
alter table public.carelink_agent_policy_acknowledgements enable row level security;
alter table public.carelink_agent_availability_updates enable row level security;
alter table public.carelink_agent_presence_events enable row level security;
alter table public.carelink_agent_document_submissions enable row level security;

-- Profile requests

drop policy if exists "carelink profile requests caregiver read" on public.carelink_agent_profile_requests;
create policy "carelink profile requests caregiver read" on public.carelink_agent_profile_requests
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_profile_requests.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink profile requests caregiver insert" on public.carelink_agent_profile_requests;
create policy "carelink profile requests caregiver insert" on public.carelink_agent_profile_requests
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_profile_requests.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

-- Policy acknowledgements

drop policy if exists "carelink policy acknowledgements caregiver read" on public.carelink_agent_policy_acknowledgements;
create policy "carelink policy acknowledgements caregiver read" on public.carelink_agent_policy_acknowledgements
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_policy_acknowledgements.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink policy acknowledgements caregiver upsert" on public.carelink_agent_policy_acknowledgements;
create policy "carelink policy acknowledgements caregiver upsert" on public.carelink_agent_policy_acknowledgements
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_policy_acknowledgements.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink policy acknowledgements caregiver update" on public.carelink_agent_policy_acknowledgements;
create policy "carelink policy acknowledgements caregiver update" on public.carelink_agent_policy_acknowledgements
for update to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_policy_acknowledgements.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
)
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_policy_acknowledgements.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

-- Availability updates

drop policy if exists "carelink availability caregiver read" on public.carelink_agent_availability_updates;
create policy "carelink availability caregiver read" on public.carelink_agent_availability_updates
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_availability_updates.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink availability caregiver insert" on public.carelink_agent_availability_updates;
create policy "carelink availability caregiver insert" on public.carelink_agent_availability_updates
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_availability_updates.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

-- Presence events

drop policy if exists "carelink presence caregiver read" on public.carelink_agent_presence_events;
create policy "carelink presence caregiver read" on public.carelink_agent_presence_events
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_presence_events.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink presence caregiver insert" on public.carelink_agent_presence_events;
create policy "carelink presence caregiver insert" on public.carelink_agent_presence_events
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_presence_events.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

-- Document submissions

drop policy if exists "carelink document submissions caregiver read" on public.carelink_agent_document_submissions;
create policy "carelink document submissions caregiver read" on public.carelink_agent_document_submissions
for select to authenticated
using (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_document_submissions.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);

drop policy if exists "carelink document submissions caregiver insert" on public.carelink_agent_document_submissions;
create policy "carelink document submissions caregiver insert" on public.carelink_agent_document_submissions
for insert to authenticated
with check (
  exists (
    select 1 from public.carelink_agent_app_access access
    where access.caregiver_id = carelink_agent_document_submissions.caregiver_id
      and access.auth_user_id::text = auth.uid()::text
      and access.mobile_enabled = true
      and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
  )
);
