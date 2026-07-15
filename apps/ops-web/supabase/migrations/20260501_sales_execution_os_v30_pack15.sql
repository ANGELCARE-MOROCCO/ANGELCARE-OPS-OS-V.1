create table if not exists sales_quality_audits (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  agent_id uuid,
  category text not null,
  score integer not null default 0,
  status text not null default 'warning',
  finding text not null,
  required_action text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sales_quality_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text unique not null,
  category text not null,
  title text not null,
  severity text not null default 'warning',
  is_blocking boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_quality_audits_deal on sales_quality_audits(deal_id);
create index if not exists idx_sales_quality_audits_status on sales_quality_audits(status);
create index if not exists idx_sales_quality_rules_key on sales_quality_rules(rule_key);

insert into sales_quality_rules (rule_key, category, title, severity, is_blocking, config)
values
  ('payment-proof-required', 'payment_risk', 'Payment proof required before activation', 'critical', true, '{"requires_proof": true}'::jsonb),
  ('discount-approval-required', 'discount_discipline', 'Discount approval required above threshold', 'warning', false, '{"threshold_percent": 15}'::jsonb),
  ('handoff-readiness-required', 'handoff_quality', 'Fulfillment handoff must be complete', 'critical', true, '{"requires_checklist": true}'::jsonb)
on conflict (rule_key) do nothing;
