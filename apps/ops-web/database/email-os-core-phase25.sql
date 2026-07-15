create table if not exists email_os_core_executive_escalations (
  id text primary key,
  thread_id text not null,
  escalation_level text not null default 'manager',
  escalation_reason text,
  assigned_executive text,
  status text not null default 'open',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_escalation_policies (
  id text primary key,
  policy_name text not null,
  trigger_type text not null,
  severity text not null default 'medium',
  conditions jsonb not null default '{}',
  actions jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table email_os_core_executive_escalations disable row level security;
alter table email_os_core_escalation_policies disable row level security;
