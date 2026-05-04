-- SALES MODULE V30 PACK 13
-- Automation Control Tower
-- Sales-only tables. Does not replace shared objective owner APIs or unrelated modules.

create table if not exists sales_automation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text unique not null,
  name text not null,
  description text,
  trigger_type text not null,
  action_type text not null,
  owner_role text not null default 'sales_agent',
  status text not null default 'active',
  priority text not null default 'medium',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_automation_queue (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null,
  lead_id uuid null,
  rule_id uuid references sales_automation_rules(id) on delete set null,
  title text not null,
  required_action text not null,
  owner_role text not null default 'sales_agent',
  priority text not null default 'medium',
  status text not null default 'open',
  due_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sales_automation_alerts (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null,
  lead_id uuid null,
  queue_id uuid references sales_automation_queue(id) on delete set null,
  title text not null,
  message text not null,
  severity text not null default 'high',
  recommended_action text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create table if not exists sales_automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references sales_automation_rules(id) on delete set null,
  deal_id uuid null,
  lead_id uuid null,
  result text not null,
  action_taken text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_automation_queue_status_priority
  on sales_automation_queue(status, priority);

create index if not exists idx_sales_automation_alerts_status_severity
  on sales_automation_alerts(status, severity);

create index if not exists idx_sales_automation_runs_rule_created
  on sales_automation_runs(rule_id, created_at desc);

insert into sales_automation_rules (rule_key, name, description, trigger_type, action_type, owner_role, priority, config)
values
  (
    'payment_promise_sla_guard',
    'Payment Promise SLA Guard',
    'Creates urgent follow-up when a payment promise is near breach or overdue.',
    'payment_promise_due_soon',
    'create_urgent_followup',
    'sales_agent',
    'urgent',
    '{"sla_hours":2}'::jsonb
  ),
  (
    'discount_escalation_control',
    'Discount Escalation Control',
    'Blocks unsafe discounts and routes them to sales manager approval.',
    'discount_above_threshold',
    'request_manager_approval',
    'sales_manager',
    'high',
    '{"max_agent_discount":20}'::jsonb
  ),
  (
    'closing_stall_detector',
    'Closing Stall Detector',
    'Detects stalled deals in negotiation, proposal, and payment pending stages.',
    'deal_stage_age_exceeded',
    'recommend_next_best_action',
    'sales_manager',
    'high',
    '{"max_stage_hours":48}'::jsonb
  ),
  (
    'fulfillment_readiness_gate',
    'Fulfillment Readiness Gate',
    'Blocks fragile handoffs when activation, payment, contract, or client details are incomplete.',
    'handoff_attempted_with_missing_data',
    'block_handoff_and_create_fix_queue',
    'closing_owner',
    'high',
    '{"requires_payment_proof":true,"requires_contract":true}'::jsonb
  )
on conflict (rule_key) do nothing;
