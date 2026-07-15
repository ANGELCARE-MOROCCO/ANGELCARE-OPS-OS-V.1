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

create index if not exists idx_carelink_schedule_workflow_states_source
  on public.carelink_schedule_workflow_states(source_type, source_id);

create index if not exists idx_carelink_schedule_workflow_states_status
  on public.carelink_schedule_workflow_states(current_status);

create index if not exists idx_carelink_schedule_workflow_states_validation
  on public.carelink_schedule_workflow_states(validation_status);

create index if not exists idx_carelink_schedule_action_logs_entity
  on public.carelink_schedule_action_logs(entity_type, entity_id);
