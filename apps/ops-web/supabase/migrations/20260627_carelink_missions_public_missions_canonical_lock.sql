create table if not exists public.carelink_mission_workflow_states (
  id bigserial primary key,
  source_type text not null default 'missions',
  source_id text not null,
  mission_id bigint null,
  current_status text null,
  lifecycle_stage text null,
  dispatch_status text null,
  validation_status text null,
  report_status text null,
  assignment_status text null,
  payment_status text null,
  primary_caregiver_id bigint null,
  backup_caregiver_id bigint null,
  risk_level text null,
  last_action text null,
  last_action_at timestamptz not null default now(),
  last_action_by text null,
  canonical_bridge_status text null,
  canonical_bridge_error text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_type, source_id)
);

alter table public.carelink_mission_workflow_states
  add column if not exists mission_id bigint null,
  add column if not exists current_status text null,
  add column if not exists lifecycle_stage text null,
  add column if not exists dispatch_status text null,
  add column if not exists validation_status text null,
  add column if not exists report_status text null,
  add column if not exists assignment_status text null,
  add column if not exists payment_status text null,
  add column if not exists primary_caregiver_id bigint null,
  add column if not exists backup_caregiver_id bigint null,
  add column if not exists risk_level text null,
  add column if not exists last_action text null,
  add column if not exists last_action_at timestamptz not null default now(),
  add column if not exists last_action_by text null,
  add column if not exists canonical_bridge_status text null,
  add column if not exists canonical_bridge_error text null,
  add column if not exists notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.carelink_mission_action_logs (
  id bigserial primary key,
  mission_id bigint null,
  mission_code text null,
  action_type text not null,
  source_type text null default 'missions',
  source_id text null,
  payload jsonb not null default '{}'::jsonb,
  canonical_bridge_status text null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.carelink_mission_notifications (
  id bigserial primary key,
  audience_type text not null,
  caregiver_id bigint null,
  mission_id bigint null,
  mission_code text null,
  title text not null,
  body text null,
  action_type text not null,
  priority text not null default 'normal',
  delivery_status text not null default 'queued',
  is_read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_missions_mission_code on public.missions(mission_code);
create index if not exists idx_missions_mission_date on public.missions(mission_date);
create index if not exists idx_missions_caregiver_id on public.missions(caregiver_id);
create index if not exists idx_missions_backup_caregiver_id on public.missions(backup_caregiver_id);
create index if not exists idx_missions_status on public.missions(status);
create index if not exists idx_missions_lifecycle_stage on public.missions(lifecycle_stage);
create index if not exists idx_missions_dispatch_status on public.missions(dispatch_status);
create index if not exists idx_missions_validation_status on public.missions(validation_status);
create index if not exists idx_missions_report_status on public.missions(report_status);
create index if not exists idx_missions_risk_level on public.missions(risk_level);
create index if not exists idx_missions_parent_mission_id on public.missions(parent_mission_id);

create index if not exists idx_carelink_mission_workflow_states_mission_id
  on public.carelink_mission_workflow_states(mission_id);
create index if not exists idx_carelink_mission_workflow_states_source
  on public.carelink_mission_workflow_states(source_type, source_id);
create index if not exists idx_carelink_mission_action_logs_mission
  on public.carelink_mission_action_logs(mission_id);
create index if not exists idx_carelink_mission_notifications_mission
  on public.carelink_mission_notifications(mission_id, is_read);
create index if not exists idx_carelink_mission_notifications_audience
  on public.carelink_mission_notifications(audience_type, is_read);
