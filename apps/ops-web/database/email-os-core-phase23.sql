
create table if not exists email_os_core_assignment_queues (
  id text primary key,
  name text not null,
  team_key text not null default 'operations',
  status text not null default 'active',
  routing_rules jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_team_workloads (
  id text primary key,
  agent_key text not null,
  team_key text not null default 'operations',
  active_threads integer not null default 0,
  capacity integer not null default 20,
  status text not null default 'available',
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_thread_locks (
  id text primary key,
  thread_id text not null,
  locked_by text not null,
  lock_reason text,
  expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_presence (
  id text primary key,
  agent_key text not null,
  team_key text not null default 'operations',
  status text not null default 'online',
  current_thread_id text,
  last_seen_at timestamptz not null default now()
);

alter table email_os_core_assignment_queues disable row level security;
alter table email_os_core_team_workloads disable row level security;
alter table email_os_core_thread_locks disable row level security;
alter table email_os_core_presence disable row level security;

create index if not exists email_os_core_assignment_queues_team_idx
on email_os_core_assignment_queues(team_key);

create index if not exists email_os_core_workloads_agent_idx
on email_os_core_team_workloads(agent_key);

create index if not exists email_os_core_thread_locks_thread_idx
on email_os_core_thread_locks(thread_id);

create index if not exists email_os_core_presence_agent_idx
on email_os_core_presence(agent_key);
