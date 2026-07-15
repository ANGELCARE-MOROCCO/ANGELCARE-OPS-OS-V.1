-- MARKET-OS CAMPAIGN LIFECYCLE V3 CORE
-- Safe additive migration: creates execution-depth tables only if they do not exist.

create table if not exists market_os_campaign_approvals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  gate text not null,
  status text not null default 'pending',
  requested_by text,
  approver text,
  risk_level text default 'medium',
  evidence jsonb default '{}'::jsonb,
  decision_note text,
  due_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_campaign_budget_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  entry_type text not null default 'allocation',
  channel text,
  amount numeric default 0,
  status text default 'planned',
  approved_by text,
  evidence jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_campaign_automation_rules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  name text not null,
  trigger_type text not null,
  trigger_config jsonb default '{}'::jsonb,
  action_type text not null,
  action_config jsonb default '{}'::jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_campaign_calendar_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  title text not null,
  item_type text default 'milestone',
  owner text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text default 'planned',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_campaign_module_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  module_name text not null,
  relation text,
  target_url text,
  health_score integer default 70,
  status text default 'connected',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
