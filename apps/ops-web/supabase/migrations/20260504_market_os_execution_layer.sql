-- Market-OS execution layer extension for Ambassador Program and Partners Network
create table if not exists market_os_execution_events (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  collection text not null,
  action_key text not null,
  target_id text,
  target_title text,
  status text default 'synced',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists market_os_approvals (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  title text not null,
  owner_ref text,
  status text default 'Pending',
  risk text default 'Medium',
  sla text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_automation_rules (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  title text not null,
  trigger text,
  action text,
  status text default 'Active',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_communications (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  title text not null,
  audience text,
  channel text,
  status text default 'Draft',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_market_os_execution_events_module on market_os_execution_events(module);
create index if not exists idx_market_os_approvals_module_status on market_os_approvals(module, status);
create index if not exists idx_market_os_automation_rules_module_status on market_os_automation_rules(module, status);
