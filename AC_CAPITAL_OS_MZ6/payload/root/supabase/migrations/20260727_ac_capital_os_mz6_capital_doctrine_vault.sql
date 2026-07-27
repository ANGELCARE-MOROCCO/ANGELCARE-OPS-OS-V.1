-- AC CAPITAL OS Mega Ultra ZIP 06 — Capital Doctrine Vault + Monthly / Manual Injection Center
-- Contract token: MZ6_AC_CAPITAL_OS_CAPITAL_DOCTRINE
-- Purpose: doctrine records, versions, commands, prompts, skills, conflicts, applications, agent bindings, monthly injections and audit events.

create table if not exists ac_capital_doctrine_categories (
  id uuid primary key default gen_random_uuid(),
  category_key text not null unique,
  label text not null,
  description text not null,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  doctrine_type text not null,
  doctrine_text text not null,
  status text not null default 'Draft',
  priority text not null default 'Medium',
  source text,
  injection_mode text not null default 'Manual',
  injected_by text,
  approval_status text,
  founder_approval_required boolean not null default false,
  applies_to_workspaces text[] not null default '{}',
  applies_to_agents text[] not null default '{}',
  active_from date,
  valid_until text,
  version text not null default 'v1.0',
  replaces_doctrine_id uuid references ac_capital_doctrine_items(id),
  conflict_sensitivity text not null default 'medium',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_versions (
  id uuid primary key default gen_random_uuid(),
  doctrine_id uuid not null references ac_capital_doctrine_items(id) on delete cascade,
  version text not null,
  previous_version text,
  change_summary text,
  doctrine_text text not null,
  changed_by text,
  approval_status text,
  active_from date,
  replaced_by uuid references ac_capital_doctrine_items(id),
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_commands (
  id uuid primary key default gen_random_uuid(),
  command_title text not null,
  command_text text not null,
  target_workspace text,
  target_agent text,
  priority text not null default 'Medium',
  status text not null default 'Draft',
  approval_required boolean not null default true,
  active_from date,
  valid_until text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_name text not null,
  target_agent text not null,
  target_workspace text not null,
  prompt_body text,
  input_requirements text,
  output_requirements text,
  risk_level text not null default 'medium',
  approval_required boolean not null default false,
  version text not null default 'v1.0',
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_skills (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null,
  skill_category text not null,
  applicable_agents text[] not null default '{}',
  applicable_workspaces text[] not null default '{}',
  skill_description text not null,
  input_expectations text,
  output_standards text,
  caution_rules text,
  version text not null default 'v1.0',
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_conflicts (
  id uuid primary key default gen_random_uuid(),
  doctrine_a_id uuid references ac_capital_doctrine_items(id),
  doctrine_b_id uuid references ac_capital_doctrine_items(id),
  conflict_title text not null,
  severity text not null default 'medium',
  affected_workspaces text[] not null default '{}',
  recommended_resolution text,
  founder_review_required boolean not null default false,
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_applications (
  id uuid primary key default gen_random_uuid(),
  doctrine_id uuid references ac_capital_doctrine_items(id) on delete cascade,
  workspace text not null,
  applied_to_active_cases boolean not null default false,
  last_applied_at timestamptz,
  owner text,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_agent_bindings (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  active_doctrine_count integer not null default 0,
  active_prompt_count integer not null default 0,
  active_skill_count integer not null default 0,
  last_doctrine_update timestamptz,
  doctrine_conflicts integer not null default 0,
  allowed_output_types text[] not null default '{}',
  forbidden_behaviors text[] not null default '{}',
  human_approval_requirement text,
  confidence_policy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_monthly_injections (
  id uuid primary key default gen_random_uuid(),
  injection_month text not null,
  title text not null,
  generated_doctrine_items integer not null default 0,
  ai_confidence integer not null default 0 check (ai_confidence >= 0 and ai_confidence <= 100),
  sources_required boolean not null default true,
  review_status text not null default 'Generated',
  suggested_changes text[] not null default '{}',
  affected_workspaces text[] not null default '{}',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_doctrine_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor text,
  doctrine_id uuid references ac_capital_doctrine_items(id),
  doctrine_title text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists ac_capital_doctrine_items_status_idx on ac_capital_doctrine_items(status);
create index if not exists ac_capital_doctrine_items_category_idx on ac_capital_doctrine_items(category);
create index if not exists ac_capital_doctrine_conflicts_status_idx on ac_capital_doctrine_conflicts(status);
create index if not exists ac_capital_doctrine_agent_bindings_agent_idx on ac_capital_doctrine_agent_bindings(agent_name);
