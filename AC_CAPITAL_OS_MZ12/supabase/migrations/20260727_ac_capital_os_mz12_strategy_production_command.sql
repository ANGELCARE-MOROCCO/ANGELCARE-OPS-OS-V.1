create extension if not exists pgcrypto;

create table if not exists public.ac_capital_strategy_scenarios (
  id uuid primary key default gen_random_uuid(),
  scenario_name text not null,
  strategy_type text not null,
  focus text[] not null default '{}',
  speed text,
  credibility text,
  proof_readiness text,
  founder_control_score numeric(5,2) check (founder_control_score >= 0 and founder_control_score <= 100),
  risk_level text,
  recommended_priority text,
  currency_label text not null default 'Dh',
  status text not null default 'Draft',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_scenario_inputs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references public.ac_capital_strategy_scenarios(id) on delete cascade,
  requested_amount numeric(14,2),
  monthly_operating_runway numeric(14,2),
  bfr_allocation_percent numeric(5,2),
  treasury_reserve numeric(14,2),
  bank_interest_logic text,
  repayment_start_logic text,
  grant_amount numeric(14,2),
  vc_ticket_size numeric(14,2),
  dilution_sensitivity text,
  revenue_ramp_scenario text,
  cost_control_level text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_scenario_outputs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references public.ac_capital_strategy_scenarios(id) on delete cascade,
  runway_estimate text,
  bfr_pressure text,
  treasury_reserve_protection text,
  repayment_sensitivity text,
  founder_control_impact text,
  risk_level text,
  recommended_strategy text,
  required_proof text[] not null default '{}',
  founder_approval_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_comparisons (
  id uuid primary key default gen_random_uuid(),
  criteria text not null,
  bank_first text,
  grant_impact text,
  vc_angel text,
  strategic_partner text,
  blended_finance text,
  recommended_priority text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_stress_tests (
  id uuid primary key default gen_random_uuid(),
  risk text not null,
  likelihood text,
  impact text,
  affected_workspaces text[] not null default '{}',
  early_warning_signal text,
  plan_b text,
  plan_c text,
  plan_d text,
  owner text,
  treasury_reserve_trigger text,
  founder_approval_required boolean not null default false,
  status text not null default 'Monitoring',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  purpose text,
  audience text,
  source_workspaces text[] not null default '{}',
  readiness text,
  missing_data text[] not null default '{}',
  risk_flags text[] not null default '{}',
  approval_requirement text,
  export_placeholder boolean not null default true,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.ac_capital_strategy_reports(id) on delete cascade,
  section_title text not null,
  section_order integer not null default 0,
  source_workspace text,
  readiness text,
  missing_data text[] not null default '{}',
  risk_flags text[] not null default '{}',
  content_placeholder text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_sop_manuals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purpose text,
  performed_by text,
  prerequisites text[] not null default '{}',
  safety_warnings text[] not null default '{}',
  required_proof text[] not null default '{}',
  approval_rule text,
  completion_criteria text,
  escalation_condition text,
  linked_workspace text,
  audit_event_required boolean not null default true,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_sop_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid references public.ac_capital_sop_manuals(id) on delete cascade,
  step_order integer not null default 0,
  step_title text not null,
  step_instruction text,
  safety_warning text,
  proof_required text,
  approval_rule text,
  completion_criteria text,
  escalation_condition text,
  audit_event text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_production_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  status text not null,
  evidence text,
  next_action text,
  owner text,
  severity text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_seeded_to_live_wiring_map (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  ui_exists boolean not null default false,
  api_exists boolean not null default false,
  sql_table_exists text not null default 'pending',
  database_read_wired boolean not null default false,
  database_write_wired boolean not null default false,
  ai_provider_wired text not null default 'pending',
  file_upload_wired boolean not null default false,
  audit_wired boolean not null default false,
  permissions_wired boolean not null default false,
  production_ready boolean not null default false,
  status text not null default 'Needs Wiring',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_launch_control_checklist (
  id uuid primary key default gen_random_uuid(),
  checklist_item text not null,
  status text not null default 'Open',
  owner text,
  evidence text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_database_activation_status (
  id uuid primary key default gen_random_uuid(),
  data_mode text not null default 'seeded-contract',
  database_foundation text not null default 'tables-created',
  live_persistence text not null default 'pending',
  ai_provider_bridge text not null default 'provider-control-ready',
  automatic_submission boolean not null default false,
  table_count_checkpoint text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_production_blockers (
  id uuid primary key default gen_random_uuid(),
  blocker_title text not null,
  category text,
  severity text,
  affected_workspaces text[] not null default '{}',
  owner text,
  status text not null default 'Open',
  resolution_plan text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_strategy_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  object_type text,
  object_id text,
  before_state jsonb,
  after_state jsonb,
  risk_level text,
  approval_requirement text,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.ac_capital_strategy_scenarios enable row level security;
alter table public.ac_capital_strategy_scenario_inputs enable row level security;
alter table public.ac_capital_strategy_scenario_outputs enable row level security;
alter table public.ac_capital_strategy_comparisons enable row level security;
alter table public.ac_capital_strategy_stress_tests enable row level security;
alter table public.ac_capital_strategy_reports enable row level security;
alter table public.ac_capital_strategy_report_sections enable row level security;
alter table public.ac_capital_sop_manuals enable row level security;
alter table public.ac_capital_sop_workflow_steps enable row level security;
alter table public.ac_capital_production_readiness_checks enable row level security;
alter table public.ac_capital_seeded_to_live_wiring_map enable row level security;
alter table public.ac_capital_launch_control_checklist enable row level security;
alter table public.ac_capital_database_activation_status enable row level security;
alter table public.ac_capital_production_blockers enable row level security;
alter table public.ac_capital_strategy_audit_events enable row level security;
