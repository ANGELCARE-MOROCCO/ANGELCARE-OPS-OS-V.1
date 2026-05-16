
-- SALES MODULE V30 PACK 5 — INTELLIGENCE, AUDIT, RISK AND CEO CONTROL
create table if not exists sales_quality_audits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  deal_id uuid null,
  agent_id uuid null,
  audit_score numeric default 0,
  qualification_score numeric default 0,
  script_score numeric default 0,
  objection_score numeric default 0,
  followup_score numeric default 0,
  payment_lock_score numeric default 0,
  promise_quality_score numeric default 0,
  verdict text,
  corrective_action text,
  created_at timestamptz default now()
);

create table if not exists sales_lost_deal_autopsies (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  agent_id uuid null,
  loss_reason text not null,
  root_cause text,
  preventable boolean default false,
  competitor_factor text,
  price_issue text,
  followup_failure text,
  recovery_possible boolean default false,
  recovery_action text,
  playbook_learning text,
  created_at timestamptz default now()
);

create table if not exists sales_ceo_intervention_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  deal_id uuid null,
  priority text default 'P2',
  trigger_reason text not null,
  requested_action text,
  manager_note text,
  ceo_decision text default 'pending',
  resolved_at timestamptz null,
  created_at timestamptz default now()
);

create table if not exists sales_risk_detections (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  deal_id uuid null,
  risk_type text not null,
  severity text default 'medium',
  signal text,
  recommended_action text,
  owner_id uuid null,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists sales_performance_diagnosis (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid null,
  period_start date,
  period_end date,
  response_score numeric default 0,
  conversion_score numeric default 0,
  followup_score numeric default 0,
  payment_quality_score numeric default 0,
  handoff_quality_score numeric default 0,
  strengths text,
  weaknesses text,
  manager_prescription text,
  created_at timestamptz default now()
);

create table if not exists sales_source_roi_diagnosis (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  lead_volume integer default 0,
  qualified_volume integer default 0,
  won_volume integer default 0,
  payment_quality text,
  fulfillment_risk text,
  source_decision text,
  created_at timestamptz default now()
);

create table if not exists sales_city_zone_heatmap (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  zone text,
  demand_level text,
  closeability text,
  fulfillment_capacity text,
  margin_signal text,
  sales_command text,
  created_at timestamptz default now()
);
