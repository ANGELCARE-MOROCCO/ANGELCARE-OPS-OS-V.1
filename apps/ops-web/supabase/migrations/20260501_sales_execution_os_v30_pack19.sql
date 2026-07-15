create table if not exists sales_autopilot_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_key text not null,
  action_key text not null,
  mode text not null default 'approval_required',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists sales_autopilot_signals (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  signal_key text not null,
  severity text not null default 'medium',
  recommended_action text not null,
  reason text,
  requires_approval boolean not null default false,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists sales_autopilot_action_queue (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references sales_autopilot_signals(id) on delete set null,
  deal_id uuid,
  action_key text not null,
  execution_mode text not null default 'approval_required',
  approval_status text not null default 'pending',
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sales_autopilot_logs (
  id uuid primary key default gen_random_uuid(),
  action_queue_id uuid references sales_autopilot_action_queue(id) on delete set null,
  event_key text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_autopilot_signals_deal_id on sales_autopilot_signals(deal_id);
create index if not exists idx_sales_autopilot_signals_status on sales_autopilot_signals(status);
create index if not exists idx_sales_autopilot_action_queue_deal_id on sales_autopilot_action_queue(deal_id);
create index if not exists idx_sales_autopilot_action_queue_approval_status on sales_autopilot_action_queue(approval_status);
