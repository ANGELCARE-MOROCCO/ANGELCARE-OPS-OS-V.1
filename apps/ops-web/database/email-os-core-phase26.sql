create table if not exists email_os_core_executive_command_actions (
  id text primary key,
  action_type text not null,
  target_type text,
  target_id text,
  command_status text not null default 'queued',
  requested_by text,
  approved_by text,
  payload jsonb not null default '{}',
  result jsonb not null default '{}',
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create table if not exists email_os_core_intervention_logs (
  id text primary key,
  intervention_type text not null,
  target_type text,
  target_id text,
  actor text,
  outcome text,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_policy_execution_results (
  id text primary key,
  policy_id text,
  policy_name text,
  execution_status text not null default 'completed',
  actions_created integer not null default 0,
  metadata jsonb not null default '{}',
  executed_at timestamptz not null default now()
);

alter table email_os_core_executive_command_actions disable row level security;
alter table email_os_core_intervention_logs disable row level security;
alter table email_os_core_policy_execution_results disable row level security;

create index if not exists email_os_core_exec_actions_status_idx on email_os_core_executive_command_actions(command_status);
create index if not exists email_os_core_intervention_target_idx on email_os_core_intervention_logs(target_type, target_id);
create index if not exists email_os_core_policy_execution_idx on email_os_core_policy_execution_results(executed_at desc);
