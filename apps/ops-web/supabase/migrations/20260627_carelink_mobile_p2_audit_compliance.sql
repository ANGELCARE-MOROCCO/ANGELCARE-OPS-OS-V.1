-- CareLink Mobile P2 corporate audit and compliance hardening
-- Adds append-only audit foundations for mobile field execution without changing OPS or mobile UI.

create table if not exists public.carelink_agent_activity_ledger (
  id bigserial primary key,
  caregiver_id bigint null,
  app_user_id text null,
  mission_id bigint null,
  activity_type text not null,
  source text not null default 'carelink_mobile',
  status text null,
  outcome text null,
  priority text not null default 'normal',
  device_context jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_carelink_agent_activity_ledger_caregiver_id
  on public.carelink_agent_activity_ledger(caregiver_id);

create index if not exists idx_carelink_agent_activity_ledger_mission_id
  on public.carelink_agent_activity_ledger(mission_id);

create index if not exists idx_carelink_agent_activity_ledger_activity_type
  on public.carelink_agent_activity_ledger(activity_type);

create index if not exists idx_carelink_agent_activity_ledger_occurred_at
  on public.carelink_agent_activity_ledger(occurred_at desc);

create table if not exists public.carelink_mission_timeline_audit (
  id bigserial primary key,
  mission_id bigint not null,
  caregiver_id bigint null,
  action_type text not null,
  event_type text not null,
  source text not null default 'carelink_mobile',
  outcome text not null default 'recorded',
  previous_status text null,
  next_status text null,
  previous_lifecycle_stage text null,
  next_lifecycle_stage text null,
  arrival_delta_minutes integer null,
  start_delta_minutes integer null,
  completion_delta_minutes integer null,
  compliance_flags text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_carelink_mission_timeline_audit_mission_id
  on public.carelink_mission_timeline_audit(mission_id);

create index if not exists idx_carelink_mission_timeline_audit_caregiver_id
  on public.carelink_mission_timeline_audit(caregiver_id);

create index if not exists idx_carelink_mission_timeline_audit_action_type
  on public.carelink_mission_timeline_audit(action_type);

create index if not exists idx_carelink_mission_timeline_audit_occurred_at
  on public.carelink_mission_timeline_audit(occurred_at desc);

create table if not exists public.carelink_dispatch_sla_audit_snapshots (
  id bigserial primary key,
  mission_id bigint not null,
  caregiver_id bigint null,
  action_type text not null,
  source text not null default 'carelink_mobile',
  sla_status text not null default 'unknown',
  arrival_delta_minutes integer null,
  start_delta_minutes integer null,
  completion_delta_minutes integer null,
  risk_level text null,
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists idx_carelink_dispatch_sla_audit_snapshots_mission_id
  on public.carelink_dispatch_sla_audit_snapshots(mission_id);

create index if not exists idx_carelink_dispatch_sla_audit_snapshots_caregiver_id
  on public.carelink_dispatch_sla_audit_snapshots(caregiver_id);

create index if not exists idx_carelink_dispatch_sla_audit_snapshots_sla_status
  on public.carelink_dispatch_sla_audit_snapshots(sla_status);

create index if not exists idx_carelink_dispatch_sla_audit_snapshots_captured_at
  on public.carelink_dispatch_sla_audit_snapshots(captured_at desc);
