create table if not exists public.b2b_workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null unique default 'global',
  settings jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_workspace_automation_rules (
  id text primary key,
  name text not null default '',
  status text not null default 'Active',
  sector text not null default 'all',
  trigger text not null default '',
  condition text not null default '',
  action text not null default '',
  cadence text not null default 'Immediate',
  owner text not null default 'B2B Partnerships Manager',
  severity text not null default 'Medium',
  channels jsonb not null default '[]'::jsonb,
  ai_brief text not null default '',
  expected_impact text not null default '',
  trigger_key text not null default '',
  field_key text not null default '',
  score_delta numeric not null default 0,
  is_active boolean not null default true,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_workspace_automation_rules_sector_status
  on public.b2b_workspace_automation_rules (sector, status);

create index if not exists idx_b2b_workspace_automation_rules_deleted_at
  on public.b2b_workspace_automation_rules (deleted_at);

create table if not exists public.b2b_workspace_partner_programs (
  id text primary key,
  sector text not null default 'hospitality',
  name text not null default '',
  status text not null default 'Ready to pitch',
  category text not null default '',
  icon text not null default '🧭',
  target_partners jsonb not null default '[]'::jsonb,
  positioning text not null default '',
  executive_pitch text not null default '',
  value_proposition jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  advantages jsonb not null default '[]'::jsonb,
  operating_model jsonb not null default '[]'::jsonb,
  commercial_model text not null default '',
  rollout jsonb not null default '[]'::jsonb,
  kpis jsonb not null default '[]'::jsonb,
  activation_assets jsonb not null default '[]'::jsonb,
  risk_controls jsonb not null default '[]'::jsonb,
  next_action text not null default '',
  owner text not null default 'B2B Partnerships',
  priority text not null default 'B',
  sector_focus text not null default '',
  description text not null default '',
  pricing_models jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  is_deleted boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_workspace_partner_programs_sector_status
  on public.b2b_workspace_partner_programs (sector, status);

create index if not exists idx_b2b_workspace_partner_programs_deleted_at
  on public.b2b_workspace_partner_programs (deleted_at);

create table if not exists public.b2b_workspace_reports (
  id text primary key,
  kind text not null default 'weekly',
  report_type text not null default 'weekly',
  purpose text not null default 'weekly',
  sector text not null default 'all',
  title text not null default '',
  reference text not null default '',
  period text not null default '',
  period_start text not null default '',
  period_end text not null default '',
  status text not null default 'Generated',
  generated_at timestamptz not null default now(),
  owner text not null default 'ANGELCARE Controller Agent',
  executive_summary text not null default '',
  alerts jsonb not null default '[]'::jsonb,
  congratulations jsonb not null default '[]'::jsonb,
  coaching jsonb not null default '[]'::jsonb,
  revenue_moves jsonb not null default '[]'::jsonb,
  reminders jsonb not null default '[]'::jsonb,
  market_insights jsonb not null default '[]'::jsonb,
  kpis jsonb not null default '[]'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  summary text not null default '',
  best_opportunities text not null default '',
  objections text not null default '',
  support_needed text not null default '',
  next_week_plan text not null default '',
  metrics jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  is_active boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2b_workspace_reports_kind_status
  on public.b2b_workspace_reports (kind, status);

create index if not exists idx_b2b_workspace_reports_deleted_at
  on public.b2b_workspace_reports (deleted_at);
