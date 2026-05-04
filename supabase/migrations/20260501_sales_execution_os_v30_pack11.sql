create table if not exists sales_ai_director_signals (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null,
  lead_id uuid null,
  owner_id uuid null,
  signal_type text not null,
  priority text not null default 'medium',
  title text not null,
  diagnosis text not null,
  recommended_action text not null,
  expected_impact text null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create table if not exists sales_ai_director_commands (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid null references sales_ai_director_signals(id) on delete set null,
  target_type text not null default 'deal',
  target_id uuid null,
  title text not null,
  instruction text not null,
  priority text not null default 'medium',
  status text not null default 'queued',
  assigned_to uuid null,
  due_at timestamptz null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists idx_sales_ai_director_signals_status on sales_ai_director_signals(status);
create index if not exists idx_sales_ai_director_signals_priority on sales_ai_director_signals(priority);
create index if not exists idx_sales_ai_director_signals_deal on sales_ai_director_signals(deal_id);
create index if not exists idx_sales_ai_director_commands_status on sales_ai_director_commands(status);
create index if not exists idx_sales_ai_director_commands_assigned_to on sales_ai_director_commands(assigned_to);
