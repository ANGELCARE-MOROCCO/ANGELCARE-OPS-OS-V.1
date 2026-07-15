-- CARELINK P12 — Report Correction / OPS Validation Loop
-- Scope: report validation status, OPS correction requests, agent resubmission, completion gating support.

alter table if exists public.carelink_mission_reports
  add column if not exists correction_status text not null default 'none',
  add column if not exists correction_required boolean not null default false,
  add column if not exists correction_requested_at timestamptz null,
  add column if not exists correction_resolved_at timestamptz null,
  add column if not exists correction_round integer not null default 0,
  add column if not exists correction_notes text null,
  add column if not exists ops_feedback text null,
  add column if not exists corrected_at timestamptz null,
  add column if not exists validated_at timestamptz null,
  add column if not exists validated_by text null;

create table if not exists public.carelink_mission_report_corrections (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null,
  caregiver_id bigint null,
  report_id uuid null,
  status text not null default 'correction_requested',
  requested_by text null,
  requested_at timestamptz null default now(),
  due_at timestamptz null,
  resolved_at timestamptz null,
  required_changes jsonb not null default '[]'::jsonb,
  ops_note text null,
  agent_response text null,
  resubmitted_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carelink_report_corrections_mission_idx on public.carelink_mission_report_corrections (mission_id, created_at desc);
create index if not exists carelink_report_corrections_caregiver_idx on public.carelink_mission_report_corrections (caregiver_id, created_at desc);
create index if not exists carelink_report_corrections_status_idx on public.carelink_mission_report_corrections (status, requested_at desc);
create index if not exists carelink_mission_reports_validation_loop_idx on public.carelink_mission_reports (validation_status, correction_status, updated_at desc);

alter table public.carelink_mission_report_corrections enable row level security;

drop policy if exists "carelink report corrections authenticated read" on public.carelink_mission_report_corrections;
create policy "carelink report corrections authenticated read"
  on public.carelink_mission_report_corrections
  for select
  to authenticated
  using (true);

drop policy if exists "carelink report corrections authenticated write" on public.carelink_mission_report_corrections;
create policy "carelink report corrections authenticated write"
  on public.carelink_mission_report_corrections
  for all
  to authenticated
  using (true)
  with check (true);
