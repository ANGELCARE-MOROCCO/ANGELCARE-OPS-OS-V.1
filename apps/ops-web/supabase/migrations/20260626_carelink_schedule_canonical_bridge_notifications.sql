create table if not exists public.carelink_schedule_notifications (
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

create table if not exists public.carelink_schedule_workflow_states (
  id bigserial primary key,
  source_type text not null,
  source_id text not null,
  schedule_event_id bigint null,
  current_status text null,
  validation_status text null,
  approval_status text not null default 'pending',
  assignment_review_status text null,
  route_review_status text null,
  approved_at timestamptz null,
  approved_by text null,
  assignment_review_requested_at timestamptz null,
  route_review_requested_at timestamptz null,
  status_changed_at timestamptz null,
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

create table if not exists public.carelink_schedule_action_logs (
  id bigserial primary key,
  action_type text not null,
  entity_type text null,
  entity_id text null,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_carelink_schedule_notifications_audience
  on public.carelink_schedule_notifications(audience_type, is_read);

create index if not exists idx_carelink_schedule_notifications_caregiver
  on public.carelink_schedule_notifications(caregiver_id);

create index if not exists idx_carelink_schedule_notifications_source
  on public.carelink_schedule_notifications(source_type, source_id);

create index if not exists idx_carelink_schedule_workflow_states_source
  on public.carelink_schedule_workflow_states(source_type, source_id);

create index if not exists idx_carelink_schedule_workflow_states_status
  on public.carelink_schedule_workflow_states(current_status);

create index if not exists idx_carelink_schedule_action_logs_entity
  on public.carelink_schedule_action_logs(entity_type, entity_id);
