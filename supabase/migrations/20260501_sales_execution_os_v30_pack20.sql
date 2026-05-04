create table if not exists sales_autopilot_safety_actions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  action_type text not null,
  recommendation text not null,
  risk_level text not null default 'low',
  status text not null default 'queued',
  reason text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  paused_by uuid,
  paused_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sales_autopilot_safety_decisions (
  id uuid primary key default gen_random_uuid(),
  safety_action_id uuid references sales_autopilot_safety_actions(id) on delete cascade,
  decision text not null,
  manager_note text,
  decided_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists sales_autopilot_block_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  rule_key text not null unique,
  threshold_value numeric,
  applies_to text not null default 'all_sales',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into sales_autopilot_block_rules (rule_name, rule_key, threshold_value, applies_to)
values
  ('Block high discount autopilot', 'discount_above_threshold', 15, 'pricing'),
  ('Block VIP autopilot', 'vip_client_requires_human', null, 'client_sensitivity'),
  ('Block contract release before readiness', 'contract_not_ready', null, 'contract')
on conflict (rule_key) do nothing;

create index if not exists idx_sales_autopilot_safety_actions_status on sales_autopilot_safety_actions(status);
create index if not exists idx_sales_autopilot_safety_actions_risk on sales_autopilot_safety_actions(risk_level);
create index if not exists idx_sales_autopilot_safety_actions_deal on sales_autopilot_safety_actions(deal_id);
