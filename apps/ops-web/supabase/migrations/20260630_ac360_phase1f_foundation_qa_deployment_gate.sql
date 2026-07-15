-- AngelCare 360 Phase 1F Foundation QA, Coverage Matrix & Deployment Gate
-- Ref: AC360-PH1F-FOUNDATION-QA-GATE-2026-06-30
-- Scope: final Phase 1 deployment gate before Phase 2 school operations. No school modules are created here.
-- Doctrine: organization status -> subscription -> entitlement -> restrictions -> capacity/usage/credits -> allow/block -> execute -> usage -> recommendations/restrictions -> audit.

create extension if not exists pgcrypto;

-- Compatibility guard for Phase 1D/1E installs that applied the hotfix manually.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

do $$
begin
  if to_regclass('public.ac360_app_action_wiring') is not null
     and to_regclass('public.ac360_action_registry') is not null
     and not exists (
       select 1 from pg_constraint
       where conname = 'ac360_app_action_wiring_fallback_action_key_fkey'
         and conrelid = 'public.ac360_app_action_wiring'::regclass
     ) then
    alter table public.ac360_app_action_wiring
      add constraint ac360_app_action_wiring_fallback_action_key_fkey
      foreign key (fallback_action_key)
      references public.ac360_action_registry(action_key)
      on delete set null;
  end if;
end $$;

create index if not exists idx_ac360_app_action_wiring_fallback_action
  on public.ac360_app_action_wiring(fallback_action_key)
  where fallback_action_key is not null;

-- -----------------------------------------------------------------------------
-- 1. Phase 1F QA and deployment gate tables.
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_foundation_qa_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  org_id uuid references public.ac360_organizations(id) on delete set null,
  phase_key text not null default 'phase_1f_foundation_qa_gate',
  status text not null default 'running',
  readiness_score numeric not null default 0,
  total_checks integer not null default 0,
  passed_checks integer not null default 0,
  warning_checks integer not null default 0,
  failed_checks integer not null default 0,
  skipped_checks integer not null default 0,
  critical_failures integer not null default 0,
  gate_status text not null default 'pending',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('running','completed','failed','archived')),
  check (gate_status in ('pending','ready','blocked','waived'))
);

create table if not exists public.ac360_foundation_qa_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ac360_foundation_qa_runs(id) on delete cascade,
  org_id uuid references public.ac360_organizations(id) on delete set null,
  check_key text not null,
  check_family text not null default 'foundation',
  severity text not null default 'medium',
  status text not null default 'skipped',
  title text not null,
  detail text,
  expected_value text,
  actual_value text,
  remediation text,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_id, check_key),
  check (severity in ('info','low','medium','high','critical')),
  check (status in ('passed','warning','failed','skipped'))
);

create table if not exists public.ac360_foundation_gate_matrix (
  matrix_key text primary key,
  phase_key text not null default 'phase_1f_foundation_qa_gate',
  gate_family text not null default 'foundation',
  gate_label text not null,
  description text,
  required boolean not null default true,
  severity text not null default 'high',
  expected_min_score numeric not null default 100,
  status text not null default 'active',
  sort_order integer not null default 100,
  metadata_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (severity in ('info','low','medium','high','critical')),
  check (status in ('active','planned','archived'))
);

create table if not exists public.ac360_engine_coverage_matrix (
  engine_code text primary key references public.ac360_foundation_engines(engine_code) on delete cascade,
  system_name text not null,
  engine_name text not null,
  phase_owner text not null,
  coverage_status text not null default 'pending_phase2',
  must_pass_phase1 boolean not null default false,
  gate_required boolean not null default false,
  evidence_table text,
  evidence_route text,
  evidence_file text,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (coverage_status in ('seeded','wired','guarded','policy_locked','qa_locked','pending_phase2','missing'))
);

create table if not exists public.ac360_deployment_gates (
  gate_key text primary key,
  phase_key text not null default 'phase_1f_foundation_qa_gate',
  gate_name text not null,
  gate_family text not null default 'foundation',
  required boolean not null default true,
  status text not null default 'pending',
  readiness_score numeric not null default 0,
  last_run_id uuid references public.ac360_foundation_qa_runs(id) on delete set null,
  blocking_reason text,
  approved_by_app_user_id uuid,
  approved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending','ready','blocked','waived'))
);

create table if not exists public.ac360_deployment_gate_events (
  id uuid primary key default gen_random_uuid(),
  gate_key text references public.ac360_deployment_gates(gate_key) on delete cascade,
  run_id uuid references public.ac360_foundation_qa_runs(id) on delete set null,
  event_key text not null,
  status text not null default 'info',
  message text not null,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (status in ('info','passed','warning','failed','blocked','ready','waived'))
);

create index if not exists idx_ac360_qa_runs_org_created on public.ac360_foundation_qa_runs(org_id, created_at desc);
create index if not exists idx_ac360_qa_results_run_status on public.ac360_foundation_qa_results(run_id, status, severity);
create index if not exists idx_ac360_engine_coverage_status on public.ac360_engine_coverage_matrix(coverage_status, must_pass_phase1, gate_required);
create index if not exists idx_ac360_deployment_gates_status on public.ac360_deployment_gates(status, required, gate_family);
create index if not exists idx_ac360_deployment_events_created on public.ac360_deployment_gate_events(gate_key, created_at desc);

alter table public.ac360_foundation_qa_runs enable row level security;
alter table public.ac360_foundation_qa_results enable row level security;
alter table public.ac360_foundation_gate_matrix enable row level security;
alter table public.ac360_engine_coverage_matrix enable row level security;
alter table public.ac360_deployment_gates enable row level security;
alter table public.ac360_deployment_gate_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_foundation_qa_runs' and policyname='ac360_qa_runs_service_role_all') then
    create policy ac360_qa_runs_service_role_all on public.ac360_foundation_qa_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_foundation_qa_results' and policyname='ac360_qa_results_service_role_all') then
    create policy ac360_qa_results_service_role_all on public.ac360_foundation_qa_results for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_foundation_gate_matrix' and policyname='ac360_gate_matrix_service_role_all') then
    create policy ac360_gate_matrix_service_role_all on public.ac360_foundation_gate_matrix for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_engine_coverage_matrix' and policyname='ac360_engine_coverage_service_role_all') then
    create policy ac360_engine_coverage_service_role_all on public.ac360_engine_coverage_matrix for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_deployment_gates' and policyname='ac360_deployment_gates_service_role_all') then
    create policy ac360_deployment_gates_service_role_all on public.ac360_deployment_gates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_deployment_gate_events' and policyname='ac360_deployment_events_service_role_all') then
    create policy ac360_deployment_events_service_role_all on public.ac360_deployment_gate_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Seeds: gate matrix, deployment gates, engine coverage, actions and wiring.
-- -----------------------------------------------------------------------------
insert into public.ac360_foundation_gate_matrix(matrix_key, gate_family, gate_label, description, required, severity, expected_min_score, sort_order, metadata_json) values
('phase1.sql_stack','database','SQL migration stack present','All Phase 1A-1F AC360 schema tables are present.',true,'critical',100,10,'{"phase":"phase_1f"}'::jsonb),
('phase1.engine_registry','engines','52-engine doctrine registered','The 52 production engines are seeded and Phase 1 engines are distinguishable.',true,'critical',100,20,'{"expected_engines":52,"phase1_engines":44}'::jsonb),
('phase1.plan_catalog','billing','Start / Pro / Command pricing catalog present','Plan catalog, versions and MAD pricing exist.',true,'critical',100,30,'{"plans":["start","pro","command"]}'::jsonb),
('phase1.entitlements','entitlements','Feature entitlement backbone active','Features, actions and plan entitlements exist for guardable decisions.',true,'critical',100,40,'{}'::jsonb),
('phase1.runtime_context','runtime','Tenant runtime bridge alive','At least one organization can resolve subscription, wallet and restrictions.',true,'high',90,50,'{}'::jsonb),
('phase1.guard_chain','guard','Production guard chain active','Guard ledger, guard RPC, usage and credits are present.',true,'critical',100,60,'{}'::jsonb),
('phase1.action_wiring','wiring','Real app action wiring active','Existing serious routes are wired to AC360 guard keys.',true,'critical',100,70,'{}'::jsonb),
('phase1.policy_lock','policy','Policy safety lock active','Fail-closed safety, override requests, blocked UX and events are ready.',true,'critical',100,80,'{}'::jsonb),
('phase1.usage_credits','usage','Usage and credit metering active','Usage meters, summaries, wallets and ledgers are ready.',true,'critical',100,90,'{}'::jsonb),
('phase1.deployment_gate','deployment','Deployment gate controls active','QA runs, results, gate matrix and deployment gates are operational.',true,'critical',100,100,'{}'::jsonb)
on conflict (matrix_key) do update set
  gate_family = excluded.gate_family,
  gate_label = excluded.gate_label,
  description = excluded.description,
  required = excluded.required,
  severity = excluded.severity,
  expected_min_score = excluded.expected_min_score,
  sort_order = excluded.sort_order,
  metadata_json = excluded.metadata_json,
  updated_at = now();

insert into public.ac360_deployment_gates(gate_key, gate_name, gate_family, required, status, readiness_score, blocking_reason, metadata_json) values
('phase1.foundation.sql','Phase 1 SQL foundation gate','database',true,'pending',0,'Not evaluated yet.','{"phase":"phase_1f"}'::jsonb),
('phase1.foundation.seeds','Phase 1 seed integrity gate','database',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.runtime.bootstrap','Runtime context and tenant gate','runtime',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.billing.entitlements','Billing entitlement gate','billing',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.guard.policy','Guard and policy lock gate','guard_policy',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.route.coverage','Route coverage matrix gate','coverage',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.usage.credits','Usage credit economy gate','usage',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.audit.traceability','Audit and decision trace gate','audit',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase1.ui.command','AC360 command UI gate','ui',true,'pending',0,'Not evaluated yet.','{}'::jsonb),
('phase2.entry.authorization','Authorization to enter Phase 2 school operations','deployment',true,'pending',0,'Blocked until Phase 1F QA is ready.','{"next_phase":"phase_2_school_operations"}'::jsonb)
on conflict (gate_key) do update set
  gate_name = excluded.gate_name,
  gate_family = excluded.gate_family,
  required = excluded.required,
  metadata_json = public.ac360_deployment_gates.metadata_json || excluded.metadata_json,
  updated_at = now();

insert into public.ac360_engine_coverage_matrix(engine_code, system_name, engine_name, phase_owner, coverage_status, must_pass_phase1, gate_required, evidence_table, evidence_route, evidence_file, notes, metadata_json)
select
  fe.engine_code,
  fe.system_group,
  fe.engine_name,
  fe.phase,
  case
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int between 1 and 21 then 'qa_locked'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int between 22 and 44 then 'policy_locked'
    else 'pending_phase2'
  end as coverage_status,
  substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 44 as must_pass_phase1,
  substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 44 as gate_required,
  case
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 5 then 'ac360_organizations'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 11 then 'ac360_user_memberships'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 21 then 'ac360_subscriptions'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 27 then 'ac360_action_registry'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 32 then 'ac360_subscription_items'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 38 then 'ac360_usage_events'
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 44 then 'ac360_restrictions'
    else null
  end,
  case
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 44 then '/angelcare-360/deployment-gate'
    else null
  end,
  case
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 44 then 'lib/ac360/phase1f-quality-gate.ts'
    else null
  end,
  case
    when substring(fe.engine_code from 'AC360-ENG-([0-9]+)')::int <= 44 then 'Phase 1 foundation engine must pass deployment gate before Phase 2.'
    else 'Planned for Phase 2+; registered for doctrine continuity but not blocking Phase 1F.'
  end,
  jsonb_build_object('source','phase_1f_seed','criticality',fe.criticality)
from public.ac360_foundation_engines fe
where fe.engine_code ~ '^AC360-ENG-[0-9]+$'
on conflict (engine_code) do update set
  system_name = excluded.system_name,
  engine_name = excluded.engine_name,
  phase_owner = excluded.phase_owner,
  coverage_status = excluded.coverage_status,
  must_pass_phase1 = excluded.must_pass_phase1,
  gate_required = excluded.gate_required,
  evidence_table = excluded.evidence_table,
  evidence_route = excluded.evidence_route,
  evidence_file = excluded.evidence_file,
  notes = excluded.notes,
  metadata_json = public.ac360_engine_coverage_matrix.metadata_json || excluded.metadata_json,
  updated_at = now();

insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('qa.foundation_run','billing_center','AC360-ENG-10','Run Phase 1F foundation QA','Execute Phase 1F QA matrix and produce readiness score.','ac360.qa.run',null,0,'block','{"phase":"phase_1f","access_type":"governance"}'::jsonb),
('deployment_gate.evaluate','billing_center','AC360-ENG-27','Evaluate Phase 1 deployment gate','Evaluate deployment gates and determine if Phase 2 entry is allowed.','ac360.deployment_gate.evaluate',null,0,'block','{"phase":"phase_1f","access_type":"governance"}'::jsonb),
('deployment_gate.decide','billing_center','AC360-ENG-27','Approve or waive deployment gate','Manual governance decision for deployment gate readiness.','ac360.deployment_gate.decide',null,0,'block','{"phase":"phase_1f","access_type":"governance"}'::jsonb),
('readiness_matrix.view','billing_center','AC360-ENG-10','View AC360 readiness matrix','Read foundation QA, engine coverage and deployment gate status.','ac360.readiness.view',null,0,'block','{"phase":"phase_1f","access_type":"read"}'::jsonb)
on conflict (action_key) do update set
  feature_key = excluded.feature_key,
  engine_code = excluded.engine_code,
  label = excluded.label,
  description = excluded.description,
  entitlement_key = excluded.entitlement_key,
  meter_key = excluded.meter_key,
  credit_cost = excluded.credit_cost,
  restriction_behavior = excluded.restriction_behavior,
  metadata_json = public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at = now();

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table, enforcement_mode, quantity_strategy, idempotency_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.qa.run','/api/ac360/qa/run','POST','qa.foundation_run','billing_center','AC360-ENG-10','angelcare_360','ac360_foundation_qa_runs','strict','fixed_1','request_or_generated',null,'active','Phase 1F QA run is guarded before execution.','{"phase":"phase_1f"}'::jsonb),
('ac360.deployment_gate.evaluate','/api/ac360/deployment-gate/evaluate','POST','deployment_gate.evaluate','billing_center','AC360-ENG-27','angelcare_360','ac360_deployment_gates','strict','fixed_1','request_or_generated','qa.foundation_run','active','Phase 1 deployment gate evaluation is guarded before execution.','{"phase":"phase_1f"}'::jsonb),
('ac360.deployment_gate.decide','/api/ac360/deployment-gate/decision','POST','deployment_gate.decide','billing_center','AC360-ENG-27','angelcare_360','ac360_deployment_gates','strict','fixed_1','request_or_generated',null,'active','Deployment gate decisions are guarded and audited.','{"phase":"phase_1f"}'::jsonb),
('ac360.readiness_matrix.view','/api/ac360/readiness-matrix','GET','readiness_matrix.view','billing_center','AC360-ENG-10','angelcare_360','ac360_engine_coverage_matrix','strict','fixed_1','request_or_generated',null,'active','Readiness matrix view is registered in route coverage.','{"phase":"phase_1f","read_only":true}'::jsonb)
on conflict (wiring_key) do update set
  route_path = excluded.route_path,
  http_method = excluded.http_method,
  action_key = excluded.action_key,
  feature_key = excluded.feature_key,
  engine_code = excluded.engine_code,
  target_module = excluded.target_module,
  target_table = excluded.target_table,
  enforcement_mode = excluded.enforcement_mode,
  quantity_strategy = excluded.quantity_strategy,
  idempotency_strategy = excluded.idempotency_strategy,
  fallback_action_key = excluded.fallback_action_key,
  status = excluded.status,
  description = excluded.description,
  metadata_json = public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at = now();

insert into public.ac360_route_coverage_audits(route_path, http_method, target_module, expected_action_key, coverage_status, enforcement_mode, metadata_json) values
('/api/ac360/qa/run','POST','angelcare_360','qa.foundation_run','covered','strict','{"phase":"phase_1f"}'::jsonb),
('/api/ac360/deployment-gate/evaluate','POST','angelcare_360','deployment_gate.evaluate','covered','strict','{"phase":"phase_1f"}'::jsonb),
('/api/ac360/deployment-gate/decision','POST','angelcare_360','deployment_gate.decide','covered','strict','{"phase":"phase_1f"}'::jsonb),
('/api/ac360/readiness-matrix','GET','angelcare_360','readiness_matrix.view','covered','strict','{"phase":"phase_1f"}'::jsonb),
('/angelcare-360/deployment-gate','GET','angelcare_360','readiness_matrix.view','covered','strict','{"phase":"phase_1f","ui":true}'::jsonb)
on conflict (route_path, http_method) do update set
  target_module = excluded.target_module,
  expected_action_key = excluded.expected_action_key,
  coverage_status = excluded.coverage_status,
  enforcement_mode = excluded.enforcement_mode,
  metadata_json = public.ac360_route_coverage_audits.metadata_json || excluded.metadata_json,
  last_scanned_at = now(),
  updated_at = now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, status, phase, sort_order) values
('phase1f.qa.fail_blocks_phase2','Phase 1F failure blocks Phase 2 entry','foundation_qa','qa.completed','{"critical_failures":">0"}'::jsonb,'{"gate":"phase2.entry.authorization","status":"blocked"}'::jsonb,'active','phase_1f',610),
('phase1f.qa.ready_authorizes_phase2','Phase 1F ready authorizes Phase 2 planning','foundation_qa','qa.completed','{"readiness_score":">=90","critical_failures":0}'::jsonb,'{"gate":"phase2.entry.authorization","status":"ready"}'::jsonb,'active','phase_1f',620),
('phase1f.coverage_missing_creates_warning','Missing strict coverage creates deployment warning','foundation_qa','route_coverage.scan','{"strict_missing":">0"}'::jsonb,'{"event":"deployment.coverage.warning"}'::jsonb,'active','phase_1f',630),
('phase1f.decision_requires_audit','Deployment decisions require audit trace','foundation_qa','deployment_gate.decide','{"always":true}'::jsonb,'{"audit":"required"}'::jsonb,'active','phase_1f',640)
on conflict (rule_key) do update set
  label = excluded.label,
  system_group = excluded.system_group,
  trigger_event = excluded.trigger_event,
  condition_json = excluded.condition_json,
  action_json = excluded.action_json,
  status = excluded.status,
  phase = excluded.phase,
  sort_order = excluded.sort_order,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. Helper functions.
-- -----------------------------------------------------------------------------
create or replace function public.ac360_count_table(p_table_name text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint := 0;
begin
  if p_table_name is null or p_table_name !~ '^ac360_[a-z0-9_]+$' then
    return 0;
  end if;
  if to_regclass('public.' || p_table_name) is null then
    return 0;
  end if;
  execute format('select count(*) from public.%I', p_table_name) into v_count;
  return coalesce(v_count, 0);
end;
$$;

create or replace function public.ac360_add_qa_result(
  p_run_id uuid,
  p_org_id uuid,
  p_check_key text,
  p_check_family text,
  p_severity text,
  p_status text,
  p_title text,
  p_detail text default null,
  p_expected_value text default null,
  p_actual_value text default null,
  p_remediation text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ac360_foundation_qa_results(run_id, org_id, check_key, check_family, severity, status, title, detail, expected_value, actual_value, remediation, evidence_json)
  values (
    p_run_id,
    p_org_id,
    p_check_key,
    coalesce(nullif(p_check_family,''),'foundation'),
    case when p_severity in ('info','low','medium','high','critical') then p_severity else 'medium' end,
    case when p_status in ('passed','warning','failed','skipped') then p_status else 'skipped' end,
    coalesce(nullif(p_title,''),p_check_key),
    p_detail,
    p_expected_value,
    p_actual_value,
    p_remediation,
    coalesce(p_evidence, '{}'::jsonb)
  )
  on conflict (run_id, check_key) do update set
    check_family = excluded.check_family,
    severity = excluded.severity,
    status = excluded.status,
    title = excluded.title,
    detail = excluded.detail,
    expected_value = excluded.expected_value,
    actual_value = excluded.actual_value,
    remediation = excluded.remediation,
    evidence_json = excluded.evidence_json;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. QA runner: database-side final gate before Phase 2.
-- -----------------------------------------------------------------------------
create or replace function public.ac360_run_foundation_qa(
  p_org_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_run_key text := 'AC360-QA-' || to_char(now(),'YYYYMMDDHH24MISSMS') || '-' || substr(gen_random_uuid()::text,1,8);
  v_required_tables text[] := array[
    'ac360_organizations','ac360_campuses','ac360_legal_profiles','ac360_academic_years',
    'ac360_user_memberships','ac360_permissions','ac360_roles','ac360_role_permissions','ac360_user_role_assignments','ac360_audit_logs',
    'ac360_foundation_engines','ac360_feature_registry','ac360_action_registry','ac360_plans','ac360_plan_versions','ac360_plan_entitlements',
    'ac360_addons','ac360_addon_entitlements','ac360_serenite_bundles','ac360_professional_services_catalog',
    'ac360_subscriptions','ac360_subscription_items','ac360_quotes','ac360_contracts','ac360_invoices','ac360_invoice_lines','ac360_payments',
    'ac360_usage_meters','ac360_usage_events','ac360_usage_summaries','ac360_credit_wallets','ac360_credit_ledger','ac360_capacity_snapshots',
    'ac360_trials','ac360_grace_periods','ac360_restriction_rules','ac360_restrictions','ac360_recommendations','ac360_automation_rules',
    'ac360_guard_decisions','ac360_app_action_wiring','ac360_policy_locks','ac360_policy_override_requests','ac360_policy_events','ac360_route_coverage_audits','ac360_blocked_action_messages',
    'ac360_foundation_qa_runs','ac360_foundation_qa_results','ac360_foundation_gate_matrix','ac360_engine_coverage_matrix','ac360_deployment_gates','ac360_deployment_gate_events'
  ];
  v_missing text[];
  v_count bigint;
  v_total integer;
  v_passed integer;
  v_warning integer;
  v_failed integer;
  v_skipped integer;
  v_critical integer;
  v_score numeric;
  v_gate_status text;
  v_has_org boolean := false;
  v_has_sub boolean := false;
  v_has_wallet boolean := false;
  v_missing_coverage bigint := 0;
  v_ready_gates integer := 0;
  v_gate_total integer := 0;
begin
  insert into public.ac360_foundation_qa_runs(run_key, org_id, actor_app_user_id, metadata_json)
  values (v_run_key, p_org_id, p_actor_app_user_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_run_id;

  select array_agg(tbl order by tbl) into v_missing
  from unnest(v_required_tables) as tbl
  where to_regclass('public.' || tbl) is null;

  perform public.ac360_add_qa_result(
    v_run_id, p_org_id, 'phase1.required_tables', 'database', 'critical',
    case when coalesce(array_length(v_missing,1),0) = 0 then 'passed' else 'failed' end,
    'Phase 1 required database tables exist',
    'Checks Phase 1A-1F tables required by billing, guard, policy and deployment gate.',
    array_length(v_required_tables,1)::text || ' tables',
    (array_length(v_required_tables,1) - coalesce(array_length(v_missing,1),0))::text || ' present',
    'Apply missing AC360 migrations in sequence before Phase 2.',
    jsonb_build_object('missingTables', coalesce(to_jsonb(v_missing),'[]'::jsonb))
  );

  v_count := public.ac360_count_table('ac360_foundation_engines');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.engine_count','engines','critical',case when v_count >= 52 then 'passed' when v_count >= 44 then 'warning' else 'failed' end,'52-engine doctrine registry','The full AngelCare 360 52-engine doctrine must remain seeded.','52 engines minimum',v_count::text,'Re-run Phase 1 foundation migration seeds.',jsonb_build_object('count',v_count));

  select count(*) into v_count from public.ac360_engine_coverage_matrix where gate_required = true and coverage_status in ('seeded','wired','guarded','policy_locked','qa_locked');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.engine_coverage','engines','critical',case when v_count >= 44 then 'passed' else 'failed' end,'Phase 1 engine coverage matrix locked','All 44 Phase 1 foundation engines must have coverage status before Phase 2.','44 Phase 1 engines covered',v_count::text,'Re-seed ac360_engine_coverage_matrix from foundation engines.',jsonb_build_object('covered',v_count));

  v_count := public.ac360_count_table('ac360_plans');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.plans','billing','critical',case when v_count >= 3 then 'passed' else 'failed' end,'Start / Pro / Command plan catalog','The three smart AC360 packages must exist before entitlement checks.','3 plans minimum',v_count::text,'Re-run pricing plan seeds.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_plan_versions');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.plan_versions','billing','high',case when v_count >= 3 then 'passed' else 'failed' end,'Active plan versions exist','Pricing must be versioned and not hard-coded.','3 active/current versions minimum',v_count::text,'Re-run Phase 1 pricing version seeds.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_feature_registry');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.feature_registry','entitlements','critical',case when v_count >= 10 then 'passed' else 'failed' end,'Feature registry exists','Every serious action must map to a feature/entitlement.','10+ features',v_count::text,'Seed AC360 feature registry.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_action_registry');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.action_registry','entitlements','critical',case when v_count >= 30 then 'passed' when v_count >= 15 then 'warning' else 'failed' end,'Action registry exists','Guardable actions must be registered before route wiring.','30+ actions recommended',v_count::text,'Re-run Phase 1C/1D/1F action registry seeds.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_usage_meters');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.usage_meters','usage','critical',case when v_count >= 7 then 'passed' else 'failed' end,'Usage meters seeded','Credits, messaging, AI, report and storage meters must exist.','7 meters minimum',v_count::text,'Re-run usage meter seeds.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_addons');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.addon_menu','addons','high',case when v_count >= 8 then 'passed' else 'warning' end,'Growth Menu add-ons seeded','Menu monetization must be visible before commercial deployment.','8 add-ons minimum',v_count::text,'Re-run add-on catalog seeds.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_app_action_wiring');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.action_wiring','wiring','critical',case when v_count >= 22 then 'passed' when v_count >= 18 then 'warning' else 'failed' end,'Real app action wiring exists','Serious routes must be wired to AC360 guard contracts.','22+ wired actions after Phase 1F',v_count::text,'Apply Phase 1D and Phase 1F wiring migrations.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_policy_locks');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.policy_locks','policy','critical',case when v_count >= 6 then 'passed' else 'failed' end,'Production policy locks seeded','Fail-closed, override and data-preservation policy locks must exist.','6+ policy locks',v_count::text,'Apply Phase 1E policy migration.',jsonb_build_object('count',v_count));

  v_count := public.ac360_count_table('ac360_blocked_action_messages');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.blocked_ux','policy','high',case when v_count >= 4 then 'passed' else 'warning' end,'Blocked-action UX messages seeded','Blocked actions must explain what happened and what to do next.','4+ blocked messages',v_count::text,'Apply Phase 1E blocked UX seeds.',jsonb_build_object('count',v_count));

  select count(*) into v_missing_coverage from public.ac360_route_coverage_audits where enforcement_mode = 'strict' and coverage_status in ('missing','expected');
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.route_coverage','coverage','critical',case when v_missing_coverage = 0 then 'passed' else 'failed' end,'Strict route coverage is complete','Strict production routes should not remain expected/missing before Phase 2.','0 missing strict routes',v_missing_coverage::text,'Run route coverage scan and wire missing routes.',jsonb_build_object('missingStrictRoutes',v_missing_coverage));

  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.rpc_bootstrap','rpc','critical',case when to_regprocedure('public.ac360_bootstrap_foundation_org(text,text,uuid,text,text,text,text)') is not null then 'passed' else 'failed' end,'Bootstrap RPC exists','Runtime tenant/subscription bootstrap must exist.','RPC present',case when to_regprocedure('public.ac360_bootstrap_foundation_org(text,text,uuid,text,text,text,text)') is not null then 'present' else 'missing' end,'Apply Phase 1B runtime bridge migration.',jsonb_build_object('rpc','ac360_bootstrap_foundation_org'));
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.rpc_guard','rpc','critical',case when to_regprocedure('public.ac360_guard_action(uuid,text,numeric,uuid,text,jsonb,boolean,numeric)') is not null then 'passed' else 'failed' end,'Guard RPC exists','Production actions must pass the guard RPC before execution.','RPC present',case when to_regprocedure('public.ac360_guard_action(uuid,text,numeric,uuid,text,jsonb,boolean,numeric)') is not null then 'present' else 'missing' end,'Apply Phase 1C guard migration.',jsonb_build_object('rpc','ac360_guard_action'));
  perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.rpc_policy','rpc','critical',case when to_regprocedure('public.ac360_resolve_policy_safety(uuid,text,text,text,text,text,numeric,uuid,jsonb)') is not null then 'passed' else 'failed' end,'Policy safety RPC exists','Policy safety must run before the normal guard chain.','RPC present',case when to_regprocedure('public.ac360_resolve_policy_safety(uuid,text,text,text,text,text,numeric,uuid,jsonb)') is not null then 'present' else 'missing' end,'Apply Phase 1E policy migration.',jsonb_build_object('rpc','ac360_resolve_policy_safety'));

  if p_org_id is not null then
    select exists(select 1 from public.ac360_organizations where id = p_org_id and status in ('trial','active','grace','restricted')) into v_has_org;
    select exists(select 1 from public.ac360_subscriptions where org_id = p_org_id and status in ('trial','active','grace','past_due','restricted')) into v_has_sub;
    select exists(select 1 from public.ac360_credit_wallets where org_id = p_org_id and wallet_key = 'main') into v_has_wallet;
    perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.runtime_org','runtime','high',case when v_has_org then 'passed' else 'failed' end,'Organization runtime context resolves','The active organization must be resolvable before deployment.','active/trial/grace/restricted org',case when v_has_org then 'present' else 'missing' end,'Bootstrap or repair AC360 organization.',jsonb_build_object('orgId',p_org_id));
    perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.runtime_subscription','runtime','critical',case when v_has_sub then 'passed' else 'failed' end,'Active subscription resolves','Every tenant must have one active billing subscription context.','subscription present',case when v_has_sub then 'present' else 'missing' end,'Bootstrap or repair AC360 subscription.',jsonb_build_object('orgId',p_org_id));
    perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.runtime_wallet','runtime','high',case when v_has_wallet then 'passed' else 'warning' end,'Main credit wallet exists','Usage and automation credits require a main wallet.','wallet present',case when v_has_wallet then 'present' else 'missing' end,'Grant or bootstrap the main AC360 wallet.',jsonb_build_object('orgId',p_org_id));
  else
    select exists(select 1 from public.ac360_organizations where status in ('trial','active','grace','restricted')) into v_has_org;
    select exists(select 1 from public.ac360_subscriptions where status in ('trial','active','grace','past_due','restricted')) into v_has_sub;
    select exists(select 1 from public.ac360_credit_wallets where wallet_key = 'main') into v_has_wallet;
    perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.runtime_org','runtime','high',case when v_has_org then 'passed' else 'failed' end,'Organization runtime context resolves','At least one AC360 organization must be bootstrapped before deployment.','one active/trial/grace/restricted org',case when v_has_org then 'present' else 'missing' end,'Bootstrap the live AC360 organization from /api/ac360/bootstrap.',jsonb_build_object('orgId',null,'globalCheck',true));
    perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.runtime_subscription','runtime','critical',case when v_has_sub then 'passed' else 'failed' end,'Active subscription resolves','At least one AC360 subscription context must exist before deployment.','one subscription present',case when v_has_sub then 'present' else 'missing' end,'Bootstrap or repair AC360 subscription.',jsonb_build_object('orgId',null,'globalCheck',true));
    perform public.ac360_add_qa_result(v_run_id,p_org_id,'phase1.runtime_wallet','runtime','high',case when v_has_wallet then 'passed' else 'warning' end,'Main credit wallet exists','At least one main credit wallet should exist before deployment.','one wallet present',case when v_has_wallet then 'present' else 'missing' end,'Grant or bootstrap the main AC360 wallet.',jsonb_build_object('orgId',null,'globalCheck',true));
  end if;

  select count(*) into v_total from public.ac360_foundation_qa_results where run_id = v_run_id;
  select count(*) into v_passed from public.ac360_foundation_qa_results where run_id = v_run_id and status = 'passed';
  select count(*) into v_warning from public.ac360_foundation_qa_results where run_id = v_run_id and status = 'warning';
  select count(*) into v_failed from public.ac360_foundation_qa_results where run_id = v_run_id and status = 'failed';
  select count(*) into v_skipped from public.ac360_foundation_qa_results where run_id = v_run_id and status = 'skipped';
  select count(*) into v_critical from public.ac360_foundation_qa_results where run_id = v_run_id and status = 'failed' and severity = 'critical';

  v_score := case when v_total = 0 then 0 else round(((v_passed::numeric + (v_warning::numeric * 0.5)) / greatest(v_total - v_skipped,1)::numeric) * 100, 2) end;
  v_gate_status := case when v_critical > 0 or v_score < 85 then 'blocked' when v_score >= 90 and v_failed = 0 then 'ready' else 'blocked' end;

  update public.ac360_foundation_qa_runs
  set status = 'completed', completed_at = now(), total_checks = v_total, passed_checks = v_passed, warning_checks = v_warning, failed_checks = v_failed, skipped_checks = v_skipped, critical_failures = v_critical, readiness_score = v_score, gate_status = v_gate_status, updated_at = now()
  where id = v_run_id;

  update public.ac360_deployment_gates
  set status = case when v_gate_status = 'ready' then 'ready' else 'blocked' end,
      readiness_score = v_score,
      last_run_id = v_run_id,
      blocking_reason = case when v_gate_status = 'ready' then null else 'Phase 1F QA has blocking failures or score below threshold.' end,
      updated_at = now()
  where gate_key in ('phase1.foundation.sql','phase1.foundation.seeds','phase1.billing.entitlements','phase1.guard.policy','phase1.route.coverage','phase1.usage.credits','phase1.audit.traceability','phase1.ui.command','phase2.entry.authorization');

  select count(*) into v_gate_total from public.ac360_deployment_gates where required = true;
  select count(*) into v_ready_gates from public.ac360_deployment_gates where required = true and status in ('ready','waived');

  insert into public.ac360_deployment_gate_events(gate_key, run_id, event_key, status, message, actor_app_user_id, metadata_json)
  values ('phase2.entry.authorization', v_run_id, 'phase1f.qa.completed', case when v_gate_status = 'ready' then 'ready' else 'blocked' end,
          case when v_gate_status = 'ready' then 'Phase 1F QA passed. Phase 2 school operations can start under the AC360 guard doctrine.' else 'Phase 1F QA blocked Phase 2 entry. Review failed checks before building school modules.' end,
          p_actor_app_user_id,
          jsonb_build_object('score',v_score,'criticalFailures',v_critical,'failedChecks',v_failed,'readyGates',v_ready_gates,'totalGates',v_gate_total));

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-10', 'phase1f.qa.completed', 'qa.foundation_run', 'qa_run', v_run_id, case when v_gate_status='ready' then 'success' else 'blocked' end, case when v_gate_status='ready' then 'info' else 'warning' end, p_actor_app_user_id, null, jsonb_build_object('score',v_score,'gateStatus',v_gate_status,'criticalFailures',v_critical));

  return jsonb_build_object(
    'ok', true,
    'runId', v_run_id,
    'runKey', v_run_key,
    'phase', 'phase_1f_foundation_qa_gate',
    'readinessScore', v_score,
    'gateStatus', v_gate_status,
    'totalChecks', v_total,
    'passedChecks', v_passed,
    'warningChecks', v_warning,
    'failedChecks', v_failed,
    'skippedChecks', v_skipped,
    'criticalFailures', v_critical,
    'phase2Allowed', v_gate_status = 'ready',
    'message', case when v_gate_status = 'ready' then 'Phase 1 foundation is deployment-gated and ready for Phase 2.' else 'Phase 1 foundation is blocked; fix QA failures before Phase 2.' end
  );
exception when others then
  update public.ac360_foundation_qa_runs set status='failed', completed_at=now(), gate_status='blocked', metadata_json = metadata_json || jsonb_build_object('error',sqlerrm), updated_at=now() where id = v_run_id;
  return jsonb_build_object('ok', false, 'runId', v_run_id, 'gateStatus','blocked','error', sqlerrm);
end;
$$;

create or replace function public.ac360_evaluate_deployment_gate(
  p_org_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qa jsonb;
  v_ready integer;
  v_total integer;
  v_blocked integer;
  v_score numeric;
begin
  v_qa := public.ac360_run_foundation_qa(p_org_id, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('source','deployment_gate.evaluate'));

  select count(*) into v_total from public.ac360_deployment_gates where required = true;
  select count(*) into v_ready from public.ac360_deployment_gates where required = true and status in ('ready','waived');
  select count(*) into v_blocked from public.ac360_deployment_gates where required = true and status = 'blocked';
  v_score := coalesce((v_qa ->> 'readinessScore')::numeric, 0);

  insert into public.ac360_deployment_gate_events(gate_key, run_id, event_key, status, message, actor_app_user_id, metadata_json)
  values ('phase2.entry.authorization', nullif(v_qa ->> 'runId','')::uuid, 'deployment_gate.evaluated', case when v_blocked = 0 and v_score >= 90 then 'ready' else 'blocked' end,
          case when v_blocked = 0 and v_score >= 90 then 'Deployment gate evaluated as ready.' else 'Deployment gate evaluated as blocked.' end,
          p_actor_app_user_id,
          jsonb_build_object('readyGates',v_ready,'totalGates',v_total,'blockedGates',v_blocked,'qa',v_qa));

  return jsonb_build_object('ok', true, 'phase','phase_1f_foundation_qa_gate', 'qa', v_qa, 'readyGates', v_ready, 'totalGates', v_total, 'blockedGates', v_blocked, 'phase2Allowed', v_blocked = 0 and v_score >= 90);
end;
$$;

create or replace function public.ac360_decide_deployment_gate(
  p_gate_key text,
  p_decision text,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_gate public.ac360_deployment_gates%rowtype;
begin
  if p_gate_key is null or not exists(select 1 from public.ac360_deployment_gates where gate_key = p_gate_key) then
    return jsonb_build_object('ok',false,'error','Unknown deployment gate.');
  end if;

  v_status := case lower(coalesce(p_decision,'')) when 'approve' then 'ready' when 'ready' then 'ready' when 'waive' then 'waived' when 'waived' then 'waived' when 'block' then 'blocked' else null end;
  if v_status is null then
    return jsonb_build_object('ok',false,'error','Decision must be approve, waive or block.');
  end if;

  update public.ac360_deployment_gates
  set status = v_status,
      blocking_reason = case when v_status='blocked' then coalesce(p_reason,'Manually blocked by AC360 governance.') else null end,
      approved_by_app_user_id = case when v_status in ('ready','waived') then p_actor_app_user_id else approved_by_app_user_id end,
      approved_at = case when v_status in ('ready','waived') then now() else approved_at end,
      metadata_json = metadata_json || coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('manualDecisionReason',p_reason),
      updated_at = now()
  where gate_key = p_gate_key
  returning * into v_gate;

  insert into public.ac360_deployment_gate_events(gate_key, event_key, status, message, actor_app_user_id, metadata_json)
  values (p_gate_key, 'deployment_gate.manual_decision', v_status, coalesce(p_reason,'Manual AC360 gate decision.'), p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb));

  perform public.ac360_record_audit(null, 'AC360-ENG-10', 'deployment_gate.decided', 'deployment_gate.decide', 'deployment_gate', null, v_status, 'warning', p_actor_app_user_id, null, jsonb_build_object('gateKey',p_gate_key,'decision',p_decision,'reason',p_reason));

  return jsonb_build_object('ok',true,'gate',to_jsonb(v_gate));
end;
$$;

create or replace function public.ac360_foundation_readiness_dashboard(p_org_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest_run public.ac360_foundation_qa_runs%rowtype;
  v_runs jsonb;
  v_results jsonb;
  v_gates jsonb;
  v_matrix jsonb;
  v_engine jsonb;
  v_events jsonb;
  v_rules jsonb;
begin
  select * into v_latest_run from public.ac360_foundation_qa_runs
  where (p_org_id is null or org_id = p_org_id or org_id is null)
  order by created_at desc
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) into v_runs
  from (select * from public.ac360_foundation_qa_runs where (p_org_id is null or org_id = p_org_id or org_id is null) order by created_at desc limit 20) r;

  select coalesce(jsonb_agg(to_jsonb(r) order by case r.status when 'failed' then 1 when 'warning' then 2 when 'skipped' then 3 else 4 end, r.check_key), '[]'::jsonb) into v_results
  from public.ac360_foundation_qa_results r
  where v_latest_run.id is not null and r.run_id = v_latest_run.id;

  select coalesce(jsonb_agg(to_jsonb(g) order by g.required desc, g.gate_key), '[]'::jsonb) into v_gates from public.ac360_deployment_gates g;
  select coalesce(jsonb_agg(to_jsonb(m) order by m.sort_order), '[]'::jsonb) into v_matrix from public.ac360_foundation_gate_matrix m where m.status = 'active';
  select coalesce(jsonb_agg(to_jsonb(e) order by e.engine_code), '[]'::jsonb) into v_engine from public.ac360_engine_coverage_matrix e;
  select coalesce(jsonb_agg(to_jsonb(ev) order by ev.created_at desc), '[]'::jsonb) into v_events from (select * from public.ac360_deployment_gate_events order by created_at desc limit 80) ev;
  select coalesce(jsonb_agg(to_jsonb(ar) order by ar.sort_order), '[]'::jsonb) into v_rules from public.ac360_automation_rules ar where ar.rule_key like 'phase1f.%';

  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_1f_foundation_qa_gate',
    'latestRun', case when v_latest_run.id is null then null else to_jsonb(v_latest_run) end,
    'runs', v_runs,
    'results', v_results,
    'gates', v_gates,
    'matrix', v_matrix,
    'engineCoverage', v_engine,
    'events', v_events,
    'rules', v_rules,
    'phase2Allowed', coalesce((select bool_and(status in ('ready','waived')) from public.ac360_deployment_gates where required=true), false)
  );
end;
$$;
