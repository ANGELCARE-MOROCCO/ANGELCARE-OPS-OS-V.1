create table if not exists public.carelink_mission_workflow_states (
  id bigserial primary key,
  source_type text not null,
  source_id text not null,
  dossier_id bigint null,
  mission_code text null,
  current_status text null,
  validation_status text null,
  assignment_status text null,
  dispatch_status text null,
  payment_status text null,
  report_status text null,
  approval_status text not null default 'pending',
  primary_caregiver_id bigint null,
  primary_caregiver_name text null,
  backup_caregiver_id bigint null,
  backup_caregiver_name text null,
  route_from text null,
  route_to text null,
  transport_mode text null,
  scheduled_start_at timestamptz null,
  scheduled_end_at timestamptz null,
  risk_level text null,
  lifecycle_notes text null,
  last_action text null,
  last_action_at timestamptz not null default now(),
  last_action_by text null,
  canonical_bridge_status text null,
  canonical_bridge_error text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_type, source_id)
);

create table if not exists public.carelink_mission_action_logs (
  id bigserial primary key,
  action_type text not null,
  source_type text null,
  source_id text null,
  dossier_id bigint null,
  mission_code text null,
  actor_name text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.carelink_mission_notifications (
  id bigserial primary key,
  audience_type text not null,
  caregiver_id bigint null,
  caregiver_name text null,
  title text not null,
  body text null,
  action_type text not null,
  source_type text null,
  source_id text null,
  workflow_state_id bigint null,
  priority text not null default 'normal',
  delivery_status text not null default 'queued',
  is_read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_carelink_mission_workflow_states_source
  on public.carelink_mission_workflow_states(source_type, source_id);

create index if not exists idx_carelink_mission_workflow_states_status
  on public.carelink_mission_workflow_states(current_status);

create index if not exists idx_carelink_mission_workflow_states_assignment
  on public.carelink_mission_workflow_states(primary_caregiver_id, backup_caregiver_id);

create index if not exists idx_carelink_mission_action_logs_source
  on public.carelink_mission_action_logs(source_type, source_id);

create index if not exists idx_carelink_mission_notifications_source
  on public.carelink_mission_notifications(source_type, source_id);

create index if not exists idx_carelink_mission_notifications_audience
  on public.carelink_mission_notifications(audience_type, is_read);
