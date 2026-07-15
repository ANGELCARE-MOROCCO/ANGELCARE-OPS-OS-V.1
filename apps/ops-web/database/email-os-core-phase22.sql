create table if not exists email_os_core_sla_policies (
  id text primary key,
  name text not null,
  entity_type text not null,
  response_minutes integer not null default 30,
  resolution_minutes integer not null default 240,
  priority text not null default 'normal',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_sla_incidents (
  id text primary key,
  entity_id text not null,
  entity_type text not null,
  sla_policy_id text,
  status text not null default 'active',
  breached boolean not null default false,
  started_at timestamptz not null default now(),
  due_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'
);

create table if not exists email_os_core_workflow_escalations (
  id text primary key,
  incident_id text,
  escalation_level integer not null default 1,
  target_team text,
  status text not null default 'pending',
  escalated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

alter table email_os_core_sla_policies disable row level security;
alter table email_os_core_sla_incidents disable row level security;
alter table email_os_core_workflow_escalations disable row level security;
