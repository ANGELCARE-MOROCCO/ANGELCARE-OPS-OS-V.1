begin;

-- ANGELCARE Marketplace Reality Completion
-- Additive specialist operating records for the domains that were previously
-- represented only through MZ2 registry metadata / generic operating cases.

create table if not exists public.angelcare_marketplace_growth_execution_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('GRC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  hypothesis text not null,
  objective text not null,
  audience_key text null,
  channel text null,
  metric_key text not null,
  baseline_value numeric null,
  target_value numeric null,
  actual_value numeric null,
  budget_dh numeric not null default 0 check (budget_dh >= 0),
  incremental_revenue_dh numeric not null default 0,
  status text not null default 'hypothesis' check (status in ('hypothesis','plan','approval','activation','monitoring','analysis','decision','scale','stop','closed')),
  decision text null,
  next_action text null,
  owner_id uuid null,
  due_at timestamptz null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_growth_exec_workspace on public.angelcare_marketplace_growth_execution_cases(workspace_key,status,updated_at desc);
create index if not exists idx_ac_mkt_growth_exec_source on public.angelcare_marketplace_growth_execution_cases(source_id) where source_id is not null;

create table if not exists public.angelcare_marketplace_qa_defect_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('QAC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  defect_type text not null,
  route_key text null,
  environment text not null default 'production',
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  reproduction_steps text not null,
  expected_result text not null,
  observed_result text not null,
  root_cause text null,
  corrective_action text null,
  retest_result text null,
  regression_scope text null,
  status text not null default 'detected' check (status in ('detected','reproduced','triaged','owned','corrective_action','retest','verified','closed')),
  owner_id uuid null,
  due_at timestamptz null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_qa_defect_workspace on public.angelcare_marketplace_qa_defect_cases(workspace_key,status,severity,updated_at desc);
create index if not exists idx_ac_mkt_qa_defect_source on public.angelcare_marketplace_qa_defect_cases(source_id) where source_id is not null;

create table if not exists public.angelcare_marketplace_intelligence_signal_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('INT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  signal_type text not null,
  source_name text not null,
  source_reference text null,
  observation text not null,
  analysis text null,
  recommendation text null,
  executive_decision text null,
  action_plan text null,
  outcome text null,
  freshness_status text not null default 'current',
  confidence numeric not null default 0 check (confidence between 0 and 100),
  materiality numeric not null default 0 check (materiality between 0 and 100),
  status text not null default 'captured' check (status in ('captured','validated','classified','analysis','recommendation','decision','action','outcome','closed')),
  owner_id uuid null,
  due_at timestamptz null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_intelligence_workspace on public.angelcare_marketplace_intelligence_signal_cases(workspace_key,status,materiality desc,updated_at desc);
create index if not exists idx_ac_mkt_intelligence_source on public.angelcare_marketplace_intelligence_signal_cases(source_id) where source_id is not null;

create table if not exists public.angelcare_marketplace_performance_incident_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('PERF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  surface text not null,
  dependency text null,
  metric_key text not null,
  observed_value numeric null,
  threshold_value numeric null,
  unit text null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  customer_impact text not null,
  mitigation text null,
  root_cause text null,
  prevention text null,
  status text not null default 'detected' check (status in ('detected','confirmed','owned','mitigation','recovery','verification','postmortem','closed')),
  detected_at timestamptz not null default now(),
  recovered_at timestamptz null,
  owner_id uuid null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_perf_inc_workspace on public.angelcare_marketplace_performance_incident_cases(workspace_key,status,severity,updated_at desc);

create table if not exists public.angelcare_marketplace_security_incident_cases_v2 (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('SEC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  asset text not null,
  attack_vector text null,
  data_exposure text null,
  containment text null,
  investigation_findings text null,
  remediation text null,
  recovery_test text null,
  postmortem text null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'detected' check (status in ('detected','triaged','containment','investigation','remediation','recovery','postmortem','closed')),
  owner_id uuid null,
  due_at timestamptz null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_security_inc_workspace on public.angelcare_marketplace_security_incident_cases_v2(workspace_key,status,severity,updated_at desc);

create table if not exists public.angelcare_marketplace_trust_investigation_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('TRI-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  allegation text not null,
  subject_reference text null,
  investigator_id uuid null,
  findings text null,
  decision text null,
  remediation text null,
  customer_resolution text null,
  verification text null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','triage','owned','investigation','decision','remediation','customer_resolution','verified','closed')),
  due_at timestamptz null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_trust_inv_workspace on public.angelcare_marketplace_trust_investigation_cases(workspace_key,status,severity,updated_at desc);

create table if not exists public.angelcare_marketplace_release_execution_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('RLS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  source_id text null,
  title text not null,
  version_label text not null,
  scope_summary text not null,
  dependency_summary text null,
  migration_summary text null,
  test_evidence text null,
  known_risks text null,
  rollback_plan text not null,
  deployment_result text null,
  verification_result text null,
  status text not null default 'draft' check (status in ('draft','preparation','technical_ready','business_ready','approved','scheduled','deployed','verifying','accepted','blocked','rolled_back','recovery','closed')),
  planned_at timestamptz null,
  deployed_at timestamptz null,
  owner_id uuid null,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_release_exec_workspace on public.angelcare_marketplace_release_execution_cases(workspace_key,status,updated_at desc);

create table if not exists public.angelcare_marketplace_reality_command_events (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  workspace_key text not null,
  territory_id uuid null,
  tenant_id uuid null,
  entity_id uuid not null,
  action text not null,
  previous_status text null,
  next_status text null,
  reason text null,
  before_value jsonb null,
  after_value jsonb null,
  actor_id uuid null,
  request_id text null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ac_mkt_reality_events_entity on public.angelcare_marketplace_reality_command_events(domain,entity_id,created_at desc);
create index if not exists idx_ac_mkt_reality_events_workspace on public.angelcare_marketplace_reality_command_events(workspace_key,created_at desc);
create index if not exists idx_ac_mkt_reality_events_scope on public.angelcare_marketplace_reality_command_events(tenant_id,territory_id,created_at desc);

-- Defense-in-depth: direct browser access is denied by RLS as well as grants.
alter table public.angelcare_marketplace_growth_execution_cases enable row level security;
alter table public.angelcare_marketplace_qa_defect_cases enable row level security;
alter table public.angelcare_marketplace_intelligence_signal_cases enable row level security;
alter table public.angelcare_marketplace_performance_incident_cases enable row level security;
alter table public.angelcare_marketplace_security_incident_cases_v2 enable row level security;
alter table public.angelcare_marketplace_trust_investigation_cases enable row level security;
alter table public.angelcare_marketplace_release_execution_cases enable row level security;
alter table public.angelcare_marketplace_reality_command_events enable row level security;

-- The service-role server layer is the only direct data authority for these
-- specialist tables. Browser/user clients are not granted direct table access.
revoke all on table public.angelcare_marketplace_growth_execution_cases from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_qa_defect_cases from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_intelligence_signal_cases from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_performance_incident_cases from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_security_incident_cases_v2 from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_trust_investigation_cases from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_release_execution_cases from public, anon, authenticated;
revoke all on table public.angelcare_marketplace_reality_command_events from public, anon, authenticated;

grant select, insert, update, delete on table public.angelcare_marketplace_growth_execution_cases to service_role;
grant select, insert, update, delete on table public.angelcare_marketplace_qa_defect_cases to service_role;
grant select, insert, update, delete on table public.angelcare_marketplace_intelligence_signal_cases to service_role;
grant select, insert, update, delete on table public.angelcare_marketplace_performance_incident_cases to service_role;
grant select, insert, update, delete on table public.angelcare_marketplace_security_incident_cases_v2 to service_role;
grant select, insert, update, delete on table public.angelcare_marketplace_trust_investigation_cases to service_role;
grant select, insert, update, delete on table public.angelcare_marketplace_release_execution_cases to service_role;
grant select, insert on table public.angelcare_marketplace_reality_command_events to service_role;

commit;
