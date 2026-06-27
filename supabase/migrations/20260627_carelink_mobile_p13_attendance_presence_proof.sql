-- CARELINK P13 — Attendance & Presence Proof
-- Scope: mobile agent day/mission presence proof, check-in/check-out trace, pause/resume, late/early reasons.

create table if not exists public.carelink_mission_presence_proofs (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null,
  caregiver_id bigint not null,
  auth_user_id text,
  action text not null,
  status text not null default 'recorded',
  proof_type text not null default 'timestamp',
  occurred_at timestamptz not null default now(),
  location_snapshot jsonb not null default '{}'::jsonb,
  device_snapshot jsonb not null default '{}'::jsonb,
  reason text,
  note text,
  risk_flag text,
  source text not null default 'carelink_mobile',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carelink_presence_proofs_mission_idx on public.carelink_mission_presence_proofs (mission_id, caregiver_id, occurred_at desc);
create index if not exists carelink_presence_proofs_action_idx on public.carelink_mission_presence_proofs (action, occurred_at desc);
create index if not exists carelink_presence_proofs_risk_idx on public.carelink_mission_presence_proofs (risk_flag, occurred_at desc);

alter table public.carelink_mission_presence_proofs enable row level security;

drop policy if exists "carelink presence proofs caregiver read" on public.carelink_mission_presence_proofs;
create policy "carelink presence proofs caregiver read"
  on public.carelink_mission_presence_proofs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_mission_presence_proofs.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink presence proofs caregiver insert" on public.carelink_mission_presence_proofs;
create policy "carelink presence proofs caregiver insert"
  on public.carelink_mission_presence_proofs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.carelink_agent_app_access access
      where access.caregiver_id = carelink_mission_presence_proofs.caregiver_id
        and access.auth_user_id::text = auth.uid()::text
        and access.mobile_enabled = true
        and lower(coalesce(access.access_status, '')) in ('active', 'enabled', 'approved', 'live')
    )
  );

drop policy if exists "carelink presence proofs authenticated write" on public.carelink_mission_presence_proofs;
create policy "carelink presence proofs authenticated write"
  on public.carelink_mission_presence_proofs
  for all
  to authenticated
  using (true)
  with check (true);
