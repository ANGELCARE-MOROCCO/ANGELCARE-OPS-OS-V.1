create table if not exists sales_agent_scorecards (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  agent_name text not null,
  deals_touched integer default 0,
  closed_deals integer default 0,
  conversion_rate numeric default 0,
  followup_discipline numeric default 0,
  average_response_minutes numeric default 0,
  revenue_protected numeric default 0,
  performance_band text default 'unstable',
  coaching_signal text,
  created_at timestamptz default now()
);

create table if not exists sales_pipeline_health_signals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text default 'medium',
  diagnosis text,
  recommended_action text,
  status text default 'open',
  created_at timestamptz default now()
);

create index if not exists idx_sales_agent_scorecards_agent_id on sales_agent_scorecards(agent_id);
create index if not exists idx_sales_agent_scorecards_created_at on sales_agent_scorecards(created_at);
create index if not exists idx_sales_pipeline_health_signals_status on sales_pipeline_health_signals(status);
