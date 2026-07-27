create extension if not exists pgcrypto;

create table if not exists public.ac_capital_ai_agents (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  agent_key text not null unique,
  purpose text,
  status text not null default 'Active',
  active_workspace text,
  last_run_at timestamptz,
  last_output_summary text,
  ai_confidence numeric(5,2) check (ai_confidence >= 0 and ai_confidence <= 100),
  doctrine_bound text[] not null default '{}',
  prompts_bound text[] not null default '{}',
  skills_bound text[] not null default '{}',
  allowed_actions text[] not null default '{}',
  forbidden_actions text[] not null default '{}',
  human_approval_required boolean not null default true,
  latest_issue_count integer not null default 0,
  last_failure text,
  cost_usage_placeholder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.ac_capital_ai_agents(id) on delete set null,
  workspace text,
  input_source text,
  doctrine_used text[] not null default '{}',
  prompt_used text,
  skill_used text,
  output_type text,
  confidence numeric(5,2) check (confidence >= 0 and confidence <= 100),
  risk_level text,
  human_approval_status text,
  status text not null default 'Queued',
  error_message text,
  linked_case_id text,
  linked_funder_id text,
  linked_opportunity_id text,
  linked_task_id text,
  created_by text,
  reviewed_by text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_name text not null,
  target_agent text,
  target_workspace text,
  prompt_version text,
  purpose text,
  input_requirements text[] not null default '{}',
  output_requirements text[] not null default '{}',
  tone_rules text[] not null default '{}',
  forbidden_claims text[] not null default '{}',
  human_approval_requirement text,
  risk_level text,
  test_status text,
  active boolean not null default true,
  owner text,
  change_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_skills (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null,
  expert_function text,
  applicable_agents text[] not null default '{}',
  applicable_workspaces text[] not null default '{}',
  active_version text,
  confidence_policy text,
  input_expectations text[] not null default '{}',
  output_standards text[] not null default '{}',
  caution_rules text[] not null default '{}',
  examples jsonb not null default '[]'::jsonb,
  last_used_at timestamptz,
  active boolean not null default true,
  review_status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_research_adapters (
  id uuid primary key default gen_random_uuid(),
  adapter_name text not null,
  mode text not null default 'Manual',
  provider_placeholder text,
  connected boolean not null default false,
  last_run_at timestamptz,
  last_source_count integer not null default 0,
  failed_runs integer not null default 0,
  average_source_confidence numeric(5,2),
  source_freshness text,
  human_review_required_count integer not null default 0,
  duplicate_detection_status text,
  api_key_status_placeholder text not null default 'No Exposed API Keys',
  cost_usage_placeholder text,
  safety_mode text not null default 'Human Review Only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_provider_settings (
  id uuid primary key default gen_random_uuid(),
  provider_name_placeholder text,
  model_tier text,
  usage_purpose text,
  cost_sensitivity text,
  monthly_budget_placeholder text,
  fallback_model text,
  max_output_risk_level text,
  allowed_agents text[] not null default '{}',
  blocked_agents text[] not null default '{}',
  sensitive_output_approval_rule text,
  status text not null default 'Planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_safety_rules (
  id uuid primary key default gen_random_uuid(),
  rule_title text not null,
  severity text not null,
  affected_agents text[] not null default '{}',
  affected_workspaces text[] not null default '{}',
  trigger_condition text,
  action_when_triggered text,
  override_allowed boolean not null default false,
  override_authority text,
  audit_required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_troubleshooting_issues (
  id uuid primary key default gen_random_uuid(),
  issue_title text not null,
  category text,
  severity text not null,
  affected_agent_id uuid references public.ac_capital_ai_agents(id) on delete set null,
  affected_workspace text,
  linked_output_id text,
  linked_case_id text,
  linked_funder_id text,
  linked_opportunity_id text,
  reported_by text,
  reported_at timestamptz not null default now(),
  reproduction_note text,
  impact text,
  recommended_fix text,
  status text not null default 'New',
  owner text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_confidence_policies (
  id uuid primary key default gen_random_uuid(),
  confidence_range text not null,
  policy text not null,
  risk_level text,
  action_required text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_audit_events (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  actor text,
  agent_id uuid references public.ac_capital_ai_agents(id) on delete set null,
  workspace text,
  action text not null,
  object_type text,
  object_id text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  risk_level text,
  approval_requirement text,
  reason text
);

create table if not exists public.ac_capital_ai_cost_usage (
  id uuid primary key default gen_random_uuid(),
  period_start date,
  period_end date,
  estimated_ai_runs integer not null default 0,
  tokens_usage_placeholder text,
  monthly_budget_placeholder text,
  provider_cost_placeholder text,
  high_cost_agents text[] not null default '{}',
  high_cost_workflows text[] not null default '{}',
  failed_run_waste integer not null default 0,
  retry_count integer not null default 0,
  cost_saving_recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_permissions (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  permissions text[] not null default '{}',
  sensitive_permission boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_human_approval_queue (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  reason text,
  target_approver text,
  linked_agent_id uuid references public.ac_capital_ai_agents(id) on delete set null,
  linked_run_id uuid references public.ac_capital_ai_agent_runs(id) on delete set null,
  linked_case_id text,
  linked_task_id text,
  status text not null default 'Pending Approval',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_provider_bridge (
  id uuid primary key default gen_random_uuid(),
  module_key text not null default 'ac_capital_os',
  provider_control_route text not null default '/ai-provider-control',
  snapshot_api text not null default '/api/ai-provider-control/snapshot',
  action_api text not null default '/api/ai-provider-control/action',
  assignment_mode text not null default 'manual',
  capability text not null default 'structured_strategy',
  dossier_strategy text,
  safety_boundary text not null default 'No Exposed API Keys',
  status text not null default 'Bridge Ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ac_capital_ai_agents enable row level security;
alter table public.ac_capital_ai_agent_runs enable row level security;
alter table public.ac_capital_ai_prompts enable row level security;
alter table public.ac_capital_ai_skills enable row level security;
alter table public.ac_capital_ai_research_adapters enable row level security;
alter table public.ac_capital_ai_provider_settings enable row level security;
alter table public.ac_capital_ai_safety_rules enable row level security;
alter table public.ac_capital_ai_troubleshooting_issues enable row level security;
alter table public.ac_capital_ai_confidence_policies enable row level security;
alter table public.ac_capital_ai_audit_events enable row level security;
alter table public.ac_capital_ai_cost_usage enable row level security;
alter table public.ac_capital_ai_permissions enable row level security;
alter table public.ac_capital_ai_human_approval_queue enable row level security;
alter table public.ac_capital_ai_provider_bridge enable row level security;
