-- AngelCare 360 Phase 2U - Final Backend Deployment Lock, SQL Compatibility Sweep & Pre-UI Instruction Handoff
-- Ref: AC360-PH2U-FINAL-BACKEND-LOCK-PRE-UI-HANDOFF-2026-06-30
-- Scope: backend/system-only final lock after Phase 2T. No AC360 front-end/UI pages are introduced.
-- Doctrine: backend-first, guard-first, fail-closed, archive-not-delete, ui_build_allowed=false until user gives visual/UX instructions.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Phase 2U final lock / SQL compatibility / pre-UI handoff tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_phase2u_sql_compatibility_sweeps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  sweep_key text not null unique,
  status text not null default 'running',
  total_checks integer not null default 0,
  passed_checks integer not null default 0,
  failed_checks integer not null default 0,
  warning_checks integer not null default 0,
  critical_failures integer not null default 0,
  compatibility_score numeric(5,2) not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('running','passed','warning','failed','blocked','archived'))
);

create table if not exists public.ac360_phase2u_sql_compatibility_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  sweep_id uuid references public.ac360_phase2u_sql_compatibility_sweeps(id) on delete cascade,
  check_key text not null,
  check_group text not null default 'sql_compatibility',
  object_name text,
  object_type text not null default 'table',
  severity text not null default 'medium',
  status text not null default 'pending',
  message text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  created_at timestamptz not null default now(),
  unique(sweep_id, check_key),
  check (object_type in ('table','column','constraint','function','policy','index','seed','route','action','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('pending','passed','warning','failed','blocked','skipped'))
);

create table if not exists public.ac360_phase2u_final_backend_locks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  lock_key text not null unique,
  lock_status text not null default 'evaluating',
  backend_status text not null default 'not_ready',
  backend_locked boolean not null default false,
  ui_build_allowed boolean not null default false,
  ui_instruction_required boolean not null default true,
  phase2_runtime_complete boolean not null default false,
  sql_compatible boolean not null default false,
  api_contracts_ready boolean not null default false,
  guard_wiring_ready boolean not null default false,
  deployment_ready boolean not null default false,
  readiness_score numeric(5,2) not null default 0,
  blocker_count integer not null default 0,
  warning_count integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(),
  evaluated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lock_status in ('evaluating','locked','ready_for_instruction','blocked','failed','archived')),
  check (backend_status in ('not_ready','backend_locked_pre_ui','ready_for_ui_instruction','blocked','failed','archived')),
  check (ui_build_allowed = false)
);

create table if not exists public.ac360_phase2u_final_backend_lock_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  lock_id uuid references public.ac360_phase2u_final_backend_locks(id) on delete cascade,
  check_key text not null,
  check_group text not null default 'final_backend_lock',
  severity text not null default 'medium',
  status text not null default 'pending',
  message text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  created_at timestamptz not null default now(),
  unique(lock_id, check_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('pending','passed','warning','failed','blocked','skipped'))
);

create table if not exists public.ac360_phase2u_release_manifests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  manifest_key text not null,
  release_label text not null default 'AC360 Backend Runtime - Phase 1 to Phase 2U',
  release_status text not null default 'draft',
  covered_phases text[] not null default array[]::text[],
  covered_systems text[] not null default array[]::text[],
  backend_only boolean not null default true,
  ui_build_allowed boolean not null default false,
  deployment_notes text,
  manifest_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, manifest_key),
  check (release_status in ('draft','locked','ready_for_instruction','blocked','archived')),
  check (ui_build_allowed = false)
);

create table if not exists public.ac360_phase2u_pre_ui_handoffs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  handoff_key text not null,
  handoff_status text not null default 'waiting_for_user_instructions',
  instruction_required boolean not null default true,
  ui_build_allowed boolean not null default false,
  visual_instruction_status text not null default 'not_received',
  required_instruction_json jsonb not null default '{}'::jsonb,
  backend_summary_json jsonb not null default '{}'::jsonb,
  lock_id uuid references public.ac360_phase2u_final_backend_locks(id) on delete set null,
  manifest_id uuid references public.ac360_phase2u_release_manifests(id) on delete set null,
  message text not null default 'Backend runtime is locked. UI/front-end build requires explicit user visual and UX instructions before proceeding.',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, handoff_key),
  check (handoff_status in ('waiting_for_user_instructions','instructions_received','ui_authorized','blocked','archived')),
  check (visual_instruction_status in ('not_received','received','needs_clarification','approved','blocked')),
  check (ui_build_allowed = false)
);

create table if not exists public.ac360_phase2u_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  alert_type text not null default 'final_backend_lock',
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  related_sweep_id uuid references public.ac360_phase2u_sql_compatibility_sweeps(id) on delete set null,
  related_lock_id uuid references public.ac360_phase2u_final_backend_locks(id) on delete set null,
  related_manifest_id uuid references public.ac360_phase2u_release_manifests(id) on delete set null,
  related_handoff_id uuid references public.ac360_phase2u_pre_ui_handoffs(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('sql_compatibility','final_backend_lock','release_manifest','pre_ui_handoff','deployment','ui_instruction','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','acknowledged','resolved','dismissed','archived'))
);

-- updated_at triggers
drop trigger if exists trg_ac360_phase2u_sql_sweeps_updated_at on public.ac360_phase2u_sql_compatibility_sweeps;
create trigger trg_ac360_phase2u_sql_sweeps_updated_at before update on public.ac360_phase2u_sql_compatibility_sweeps for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2u_locks_updated_at on public.ac360_phase2u_final_backend_locks;
create trigger trg_ac360_phase2u_locks_updated_at before update on public.ac360_phase2u_final_backend_locks for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2u_release_manifests_updated_at on public.ac360_phase2u_release_manifests;
create trigger trg_ac360_phase2u_release_manifests_updated_at before update on public.ac360_phase2u_release_manifests for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2u_handoffs_updated_at on public.ac360_phase2u_pre_ui_handoffs;
create trigger trg_ac360_phase2u_handoffs_updated_at before update on public.ac360_phase2u_pre_ui_handoffs for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2u_alerts_updated_at on public.ac360_phase2u_alerts;
create trigger trg_ac360_phase2u_alerts_updated_at before update on public.ac360_phase2u_alerts for each row execute function public.ac360_touch_updated_at();

-- indexes
create index if not exists idx_ac360_phase2u_sql_sweeps_org_status on public.ac360_phase2u_sql_compatibility_sweeps(org_id,status,created_at desc);
create index if not exists idx_ac360_phase2u_sql_results_sweep_status on public.ac360_phase2u_sql_compatibility_results(sweep_id,status,severity);
create index if not exists idx_ac360_phase2u_locks_org_status on public.ac360_phase2u_final_backend_locks(org_id,lock_status,created_at desc);
create index if not exists idx_ac360_phase2u_handoffs_org_status on public.ac360_phase2u_pre_ui_handoffs(org_id,handoff_status,created_at desc);
create index if not exists idx_ac360_phase2u_alerts_org_status on public.ac360_phase2u_alerts(org_id,status,severity,created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Feature / action / wiring registry
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,status,metadata_json)
values
('phase2_final_backend_lock','angelcare_360_phase2_final_backend_lock','governance','Phase 2 Final Backend Lock & Pre-UI Handoff','Final backend deployment lock, SQL compatibility sweep, release manifest and explicit pre-UI instruction handoff.','governance',true,false,false,null,0,'active','{"phase":"phase_2u","backendOnly":true,"uiBuildAllowed":false,"requiresUserUiInstructions":true}'::jsonb)
on conflict(feature_key) do update set
  module_key=excluded.module_key,
  family=excluded.family,
  label=excluded.label,
  description=excluded.description,
  billing_family=excluded.billing_family,
  is_core=excluded.is_core,
  is_billable=excluded.is_billable,
  is_enterprise_only=excluded.is_enterprise_only,
  default_meter_key=excluded.default_meter_key,
  default_credit_cost=excluded.default_credit_cost,
  status=excluded.status,
  metadata_json=public.ac360_feature_registry.metadata_json||excluded.metadata_json,
  updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json)
values
('phase2.sql_compatibility_sweep.run','phase2_final_backend_lock','AC360-ENG-44','Run SQL compatibility sweep','Run final SQL/schema compatibility checks across Phase 1 and Phase 2 runtime tables before UI instructions.','phase2.sql_compatibility_sweep.run',null,0,'block','{"phase":"phase_2u","access_type":"governance"}'::jsonb),
('phase2.final_backend_lock.evaluate','phase2_final_backend_lock','AC360-ENG-44','Evaluate final backend lock','Evaluate whether the backend runtime is locked and ready for user UI/UX instructions while UI build remains blocked.','phase2.final_backend_lock.evaluate',null,0,'block','{"phase":"phase_2u","access_type":"governance"}'::jsonb),
('phase2.release_manifest.create','phase2_final_backend_lock','AC360-ENG-44','Create final backend release manifest','Create the backend-only Phase 1 to Phase 2U release manifest.','phase2.release_manifest.create',null,0,'block','{"phase":"phase_2u","access_type":"governance"}'::jsonb),
('phase2.pre_ui_handoff.create','phase2_final_backend_lock','AC360-ENG-44','Create pre-UI instruction handoff','Create the explicit handoff requiring user visual and UX instructions before front-end build.','phase2.pre_ui_handoff.create',null,0,'block','{"phase":"phase_2u","access_type":"governance"}'::jsonb),
('phase2.final_lock.alert.resolve','phase2_final_backend_lock','AC360-ENG-44','Resolve Phase 2U alert','Resolve final backend lock, SQL compatibility, manifest or pre-UI handoff alerts.','phase2.final_lock.alert.resolve',null,0,'block','{"phase":"phase_2u","access_type":"governance"}'::jsonb)
on conflict(action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json||excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.phase2u.sql_compatibility_sweep.run','/api/ac360/phase2-final-lock/sql-compatibility/sweep','POST','phase2.sql_compatibility_sweep.run','phase2_final_backend_lock','AC360-ENG-44','angelcare_360_phase2_final_backend_lock','ac360_phase2u_sql_compatibility_sweeps','strict','fixed_1','request_or_generated',null,null,'active','Run final SQL/schema compatibility sweep.','{"phase":"phase_2u","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2u.final_backend_lock.evaluate','/api/ac360/phase2-final-lock/backend-lock/evaluate','POST','phase2.final_backend_lock.evaluate','phase2_final_backend_lock','AC360-ENG-44','angelcare_360_phase2_final_backend_lock','ac360_phase2u_final_backend_locks','strict','fixed_1','request_or_generated',null,null,'active','Evaluate final backend lock before UI instructions.','{"phase":"phase_2u","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2u.release_manifest.create','/api/ac360/phase2-final-lock/release-manifest/create','POST','phase2.release_manifest.create','phase2_final_backend_lock','AC360-ENG-44','angelcare_360_phase2_final_backend_lock','ac360_phase2u_release_manifests','strict','fixed_1','request_or_generated',null,null,'active','Create backend-only release manifest.','{"phase":"phase_2u","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2u.pre_ui_handoff.create','/api/ac360/phase2-final-lock/pre-ui-handoff/create','POST','phase2.pre_ui_handoff.create','phase2_final_backend_lock','AC360-ENG-44','angelcare_360_phase2_final_backend_lock','ac360_phase2u_pre_ui_handoffs','strict','fixed_1','request_or_generated',null,null,'active','Create explicit pre-UI instruction handoff.','{"phase":"phase_2u","backendOnly":true,"uiBuildAllowed":false,"requiresUserUiInstructions":true}'::jsonb),
('ac360.phase2u.alert.resolve','/api/ac360/phase2-final-lock/alerts/resolve','POST','phase2.final_lock.alert.resolve','phase2_final_backend_lock','AC360-ENG-44','angelcare_360_phase2_final_backend_lock','ac360_phase2u_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolve Phase 2U final lock alert.','{"phase":"phase_2u","backendOnly":true,"uiBuildAllowed":false}'::jsonb)
on conflict(wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  fallback_action_key=excluded.fallback_action_key,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json||excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 3. RPC helpers
-- -----------------------------------------------------------------------------
create or replace function public.ac360_phase2u_resolve_org(p_org_id uuid default null)
returns uuid
language sql
security definer
set search_path = public
as $$
  select coalesce(
    p_org_id,
    (select id from public.ac360_organizations order by created_at asc limit 1)
  )

$$;

create or replace function public.ac360_phase2u_add_sql_result(
  p_org_id uuid,
  p_sweep_id uuid,
  p_key text,
  p_group text,
  p_object text,
  p_type text,
  p_status text,
  p_severity text,
  p_message text,
  p_hint text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ac360_phase2u_sql_compatibility_results(org_id,sweep_id,check_key,check_group,object_name,object_type,severity,status,message,remediation_hint,evidence_json)
  values(p_org_id,p_sweep_id,p_key,p_group,p_object,p_type,p_severity,p_status,p_message,p_hint,p_evidence)
  on conflict(sweep_id,check_key) do update set
    status=excluded.status,
    severity=excluded.severity,
    message=excluded.message,
    remediation_hint=excluded.remediation_hint,
    evidence_json=excluded.evidence_json;
end $$;

create or replace function public.ac360_phase2u_add_lock_result(
  p_org_id uuid,
  p_lock_id uuid,
  p_key text,
  p_group text,
  p_status text,
  p_severity text,
  p_message text,
  p_hint text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ac360_phase2u_final_backend_lock_results(org_id,lock_id,check_key,check_group,severity,status,message,remediation_hint,evidence_json)
  values(p_org_id,p_lock_id,p_key,p_group,p_severity,p_status,p_message,p_hint,p_evidence)
  on conflict(lock_id,check_key) do update set
    status=excluded.status,
    severity=excluded.severity,
    message=excluded.message,
    remediation_hint=excluded.remediation_hint,
    evidence_json=excluded.evidence_json;
end $$;

create or replace function public.ac360_run_phase2u_sql_compatibility_sweep(p_org_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.ac360_phase2u_resolve_org(p_org_id);
  v_sweep_id uuid;
  v_key text := 'phase2u-sql-sweep-' || replace(gen_random_uuid()::text,'-','');
  v_total integer := 0;
  v_passed integer := 0;
  v_failed integer := 0;
  v_warning integer := 0;
  v_critical integer := 0;
  v_status text := 'passed';
  v_score numeric(5,2) := 0;
  t text;
  required_tables text[] := array[
    'ac360_organizations','ac360_app_action_wiring','ac360_action_registry','ac360_feature_registry','ac360_subscriptions','ac360_usage_events','ac360_guard_decisions','ac360_policy_locks',
    'ac360_school_students','ac360_school_guardians','ac360_school_staff','ac360_school_classes','ac360_school_attendance_events','ac360_school_finance_billing_cycles','ac360_school_communication_campaigns',
    'ac360_school_documents','ac360_school_workflow_instances','ac360_school_admission_leads','ac360_school_hr_shift_assignments','ac360_school_incident_reports','ac360_school_transport_routes',
    'ac360_school_parenttrust_complaints','ac360_school_academy_courses','ac360_school_automation_rules','ac360_school_intake_forms','ac360_school_brand_profiles','ac360_school_migration_projects',
    'ac360_internal_support_tickets','ac360_phase2s_pre_ui_gates','ac360_phase2t_deployment_readiness_runs'
  ];
begin
  insert into public.ac360_phase2u_sql_compatibility_sweeps(org_id,sweep_key,status,metadata_json)
  values(v_org_id,v_key,'running',p_metadata)
  returning id into v_sweep_id;

  foreach t in array required_tables loop
    if to_regclass('public.' || t) is null then
      perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'table.'||t,'required_tables',t,'table','failed','critical','Required AC360 runtime table is missing.','Apply missing Phase 1/2 migration before UI work.');
    else
      perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'table.'||t,'required_tables',t,'table','passed','low','Required AC360 runtime table exists.',null,jsonb_build_object('table',t));
    end if;
  end loop;

  -- Compatibility columns that repeatedly protected later phases from schema drift.
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='ac360_addons' and column_name='family') then
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'column.ac360_addons.family','schema_compatibility','ac360_addons.family','column','passed','low','ac360_addons.family exists.');
  else
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'column.ac360_addons.family','schema_compatibility','ac360_addons.family','column','failed','critical','ac360_addons.family is missing.','Use Phase 1 add-on schema or add a compatibility column.');
  end if;

  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='ac360_app_action_wiring' and column_name='fallback_action_key') then
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'column.ac360_app_action_wiring.fallback_action_key','schema_compatibility','ac360_app_action_wiring.fallback_action_key','column','passed','low','fallback_action_key exists for Phase 1E+ compatibility.');
  else
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'column.ac360_app_action_wiring.fallback_action_key','schema_compatibility','ac360_app_action_wiring.fallback_action_key','column','failed','critical','fallback_action_key is missing.','Apply Phase 1E compatibility hotfix.');
  end if;

  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='ac360_feature_registry' and column_name='billing_family') then
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'column.ac360_feature_registry.billing_family','schema_compatibility','ac360_feature_registry.billing_family','column','passed','low','feature registry billing_family exists.');
  else
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'column.ac360_feature_registry.billing_family','schema_compatibility','ac360_feature_registry.billing_family','column','failed','critical','feature registry billing_family is missing.','Apply Phase 1 feature registry migration.');
  end if;

  if (select count(*) from public.ac360_app_action_wiring where status='active') >= 120 then
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'seed.app_action_wiring.coverage','seed_coverage','ac360_app_action_wiring','seed','passed','low','Strict app-action wiring coverage is broad enough for backend runtime.',null,jsonb_build_object('active_wiring',(select count(*) from public.ac360_app_action_wiring where status='active')));
  else
    perform public.ac360_phase2u_add_sql_result(v_org_id,v_sweep_id,'seed.app_action_wiring.coverage','seed_coverage','ac360_app_action_wiring','seed','failed','critical','Not enough active app-action wiring rows for Phase 2 backend runtime.','Re-apply missing phase migrations.',jsonb_build_object('active_wiring',(select count(*) from public.ac360_app_action_wiring where status='active')));
  end if;

  select count(*),
         count(*) filter (where status='passed'),
         count(*) filter (where status='warning'),
         count(*) filter (where status in ('failed','blocked')),
         count(*) filter (where status in ('failed','blocked') and severity='critical')
    into v_total, v_passed, v_warning, v_failed, v_critical
  from public.ac360_phase2u_sql_compatibility_results
  where sweep_id=v_sweep_id;

  v_score := case when v_total = 0 then 0 else round((v_passed::numeric / v_total::numeric) * 100, 2) end;
  if v_critical > 0 then v_status := 'failed'; elsif v_warning > 0 then v_status := 'warning'; else v_status := 'passed'; end if;

  update public.ac360_phase2u_sql_compatibility_sweeps
  set status=v_status,total_checks=v_total,passed_checks=v_passed,failed_checks=v_failed,warning_checks=v_warning,critical_failures=v_critical,compatibility_score=v_score,completed_at=now(),
      summary_json=jsonb_build_object('phase','phase_2u','total',v_total,'passed',v_passed,'failed',v_failed,'warnings',v_warning,'critical',v_critical,'score',v_score,'uiBuildAllowed',false,'requiresUserUiInstructions',true)
  where id=v_sweep_id;

  if v_critical > 0 then
    insert into public.ac360_phase2u_alerts(org_id,alert_key,alert_type,severity,status,title,message,related_sweep_id,metadata_json)
    values(v_org_id,'phase2u.sql_compatibility.critical.'||v_sweep_id,'sql_compatibility','critical','open','Phase 2U SQL compatibility blockers detected','Critical SQL/schema compatibility failures must be repaired before UI instructions.',v_sweep_id,jsonb_build_object('criticalFailures',v_critical))
    on conflict(org_id,alert_key) do nothing;
  end if;

  return (select to_jsonb(s) from public.ac360_phase2u_sql_compatibility_sweeps s where s.id=v_sweep_id);
end $$;

create or replace function public.ac360_create_phase2u_release_manifest(p_org_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.ac360_phase2u_resolve_org(p_org_id);
  v_id uuid;
  v_key text := 'phase2u-release-manifest';
begin
  insert into public.ac360_phase2u_release_manifests(org_id,manifest_key,release_status,covered_phases,covered_systems,backend_only,ui_build_allowed,deployment_notes,manifest_json)
  values(
    v_org_id,
    v_key,
    'ready_for_instruction',
    array['phase_1','phase_1b','phase_1c','phase_1d','phase_1e','phase_1f','phase_2a','phase_2b','phase_2c','phase_2d','phase_2e','phase_2f','phase_2g','phase_2h','phase_2i','phase_2j','phase_2k','phase_2l','phase_2m','phase_2n','phase_2o','phase_2p','phase_2q','phase_2r','phase_2s','phase_2t','phase_2u'],
    array['tenant','rbac','billing','entitlements','usage','policy','school_ops','admissions','finance','communication','documents','workflows','hr','health_safety','transport','parenttrust','academy','automation','intake','branding_integrations','onboarding_success','internal_admin','qa_hardening'],
    true,
    false,
    'Backend runtime locked through Phase 2U. Front-end build requires explicit user UI/UX instructions.',
    jsonb_build_object('phase','phase_2u','backendOnly',true,'uiBuildAllowed',false,'requiresUserUiInstructions',true,'archiveNotDelete',true,'guardDoctrine','organization -> subscription -> entitlement -> policy -> capacity/usage/credits -> execute -> usage/audit') || p_metadata
  )
  on conflict(org_id,manifest_key) do update set
    release_status=excluded.release_status,
    covered_phases=excluded.covered_phases,
    covered_systems=excluded.covered_systems,
    backend_only=excluded.backend_only,
    ui_build_allowed=false,
    deployment_notes=excluded.deployment_notes,
    manifest_json=public.ac360_phase2u_release_manifests.manifest_json || excluded.manifest_json,
    updated_at=now()
  returning id into v_id;

  return (select to_jsonb(m) from public.ac360_phase2u_release_manifests m where m.id=v_id);
end $$;

create or replace function public.ac360_evaluate_phase2u_final_backend_lock(p_org_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.ac360_phase2u_resolve_org(p_org_id);
  v_lock_id uuid;
  v_key text := 'phase2u-final-backend-lock-' || replace(gen_random_uuid()::text,'-','');
  v_total integer := 0;
  v_passed integer := 0;
  v_failed integer := 0;
  v_warning integer := 0;
  v_blockers integer := 0;
  v_score numeric(5,2) := 0;
  v_status text := 'locked';
  v_backend_status text := 'backend_locked_pre_ui';
  v_latest_sql record;
begin
  insert into public.ac360_phase2u_final_backend_locks(org_id,lock_key,lock_status,backend_status,ui_build_allowed,ui_instruction_required,metadata_json)
  values(v_org_id,v_key,'evaluating','not_ready',false,true,p_metadata)
  returning id into v_lock_id;

  select * into v_latest_sql from public.ac360_phase2u_sql_compatibility_sweeps where org_id=v_org_id order by created_at desc limit 1;
  if v_latest_sql.id is null then
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'sql_compatibility.latest_sweep','sql_compatibility','warning','high','No Phase 2U SQL compatibility sweep found before final lock.','Run /api/ac360/phase2-final-lock/sql-compatibility/sweep first.');
  elsif v_latest_sql.critical_failures > 0 or v_latest_sql.status = 'failed' then
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'sql_compatibility.latest_sweep','sql_compatibility','failed','critical','Latest Phase 2U SQL compatibility sweep has blockers.','Repair SQL/schema failures and rerun sweep.',to_jsonb(v_latest_sql));
  else
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'sql_compatibility.latest_sweep','sql_compatibility','passed','low','Latest SQL compatibility sweep passed or has no critical blockers.',null,to_jsonb(v_latest_sql));
  end if;

  if to_regclass('public.ac360_phase2s_pre_ui_gates') is not null then
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'phase2s.pre_ui_gate.exists','pre_ui_gate','passed','low','Phase 2S pre-UI gate table exists.');
  else
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'phase2s.pre_ui_gate.exists','pre_ui_gate','failed','critical','Phase 2S pre-UI gate table is missing.','Apply Phase 2S before final lock.');
  end if;

  if to_regclass('public.ac360_phase2t_deployment_readiness_runs') is not null then
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'phase2t.deployment_readiness.exists','deployment_readiness','passed','low','Phase 2T deployment readiness table exists.');
  else
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'phase2t.deployment_readiness.exists','deployment_readiness','failed','critical','Phase 2T deployment readiness table is missing.','Apply Phase 2T before final lock.');
  end if;

  if (select count(*) from public.ac360_action_registry where action_key like 'school.%' or action_key like 'internal.%' or action_key like 'phase2.%') >= 170 then
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'action_registry.phase2_coverage','guard_wiring','passed','low','Phase 2 action registry coverage is sufficient.',null,jsonb_build_object('actions',(select count(*) from public.ac360_action_registry where action_key like 'school.%' or action_key like 'internal.%' or action_key like 'phase2.%')));
  else
    perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'action_registry.phase2_coverage','guard_wiring','failed','critical','Phase 2 action registry coverage is below expected threshold.','Re-apply missing runtime migrations.',jsonb_build_object('actions',(select count(*) from public.ac360_action_registry where action_key like 'school.%' or action_key like 'internal.%' or action_key like 'phase2.%')));
  end if;

  perform public.ac360_phase2u_add_lock_result(v_org_id,v_lock_id,'ui_build.locked','pre_ui_handoff','passed','critical','UI build remains locked until user provides explicit visual/UX instructions.',null,jsonb_build_object('uiBuildAllowed',false,'instructionRequired',true));

  select count(*),
         count(*) filter (where status='passed'),
         count(*) filter (where status='warning'),
         count(*) filter (where status in ('failed','blocked')),
         count(*) filter (where status in ('failed','blocked') and severity='critical')
    into v_total, v_passed, v_warning, v_failed, v_blockers
  from public.ac360_phase2u_final_backend_lock_results
  where lock_id=v_lock_id;

  v_score := case when v_total = 0 then 0 else round((v_passed::numeric / v_total::numeric) * 100, 2) end;
  if v_blockers > 0 then
    v_status := 'blocked';
    v_backend_status := 'blocked';
  else
    v_status := 'ready_for_instruction';
    v_backend_status := 'ready_for_ui_instruction';
  end if;

  update public.ac360_phase2u_final_backend_locks
  set lock_status=v_status,
      backend_status=v_backend_status,
      backend_locked=(v_blockers=0),
      ui_build_allowed=false,
      ui_instruction_required=true,
      phase2_runtime_complete=(v_blockers=0),
      sql_compatible=coalesce(v_latest_sql.critical_failures,0)=0,
      api_contracts_ready=(v_blockers=0),
      guard_wiring_ready=(v_blockers=0),
      deployment_ready=(v_blockers=0),
      readiness_score=v_score,
      blocker_count=v_blockers,
      warning_count=v_warning,
      evaluated_at=now(),
      summary_json=jsonb_build_object('phase','phase_2u','total',v_total,'passed',v_passed,'failed',v_failed,'warnings',v_warning,'blockers',v_blockers,'score',v_score,'backendStatus',v_backend_status,'uiBuildAllowed',false,'requiresUserUiInstructions',true),
      updated_at=now()
  where id=v_lock_id;

  if v_blockers = 0 then
    perform public.ac360_create_phase2u_release_manifest(v_org_id, jsonb_build_object('source','final_backend_lock','lockId',v_lock_id));
  else
    insert into public.ac360_phase2u_alerts(org_id,alert_key,alert_type,severity,status,title,message,related_lock_id,metadata_json)
    values(v_org_id,'phase2u.final_lock.blocked.'||v_lock_id,'final_backend_lock','critical','open','Phase 2U final backend lock is blocked','Repair critical blockers before UI instruction handoff.',v_lock_id,jsonb_build_object('blockers',v_blockers))
    on conflict(org_id,alert_key) do nothing;
  end if;

  return (select to_jsonb(l) from public.ac360_phase2u_final_backend_locks l where l.id=v_lock_id);
end $$;

create or replace function public.ac360_create_phase2u_pre_ui_handoff(p_org_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.ac360_phase2u_resolve_org(p_org_id);
  v_lock_id uuid;
  v_manifest_id uuid;
  v_id uuid;
  v_key text := 'phase2u-pre-ui-instruction-handoff';
begin
  select id into v_lock_id from public.ac360_phase2u_final_backend_locks where org_id=v_org_id order by created_at desc limit 1;
  select id into v_manifest_id from public.ac360_phase2u_release_manifests where org_id=v_org_id order by created_at desc limit 1;

  insert into public.ac360_phase2u_pre_ui_handoffs(org_id,handoff_key,handoff_status,instruction_required,ui_build_allowed,visual_instruction_status,required_instruction_json,backend_summary_json,lock_id,manifest_id,message)
  values(
    v_org_id,
    v_key,
    'waiting_for_user_instructions',
    true,
    false,
    'not_received',
    jsonb_build_object(
      'requiredBeforeUiBuild',true,
      'items',array['global visual direction','navigation/sitemap priority','dashboard information architecture','white-theme rules','card/table/modal style','mobile/desktop expectations','role-based experiences','AngelCare brand/logo rules'],
      'explicitStopRule','Do not create AC360 front-end pages until user provides instructions.'
    ),
    jsonb_build_object('phase','phase_2u','backendLocked',true,'uiBuildAllowed',false,'coveredThrough','Phase 2U','guardDoctrine','strict AC360 wired actions'),
    v_lock_id,
    v_manifest_id,
    'AngelCare 360 backend runtime is locked through Phase 2U. UI/front-end build must wait for explicit user visual and UX instructions.'
  )
  on conflict(org_id,handoff_key) do update set
    handoff_status='waiting_for_user_instructions',
    instruction_required=true,
    ui_build_allowed=false,
    visual_instruction_status='not_received',
    required_instruction_json=excluded.required_instruction_json,
    backend_summary_json=excluded.backend_summary_json,
    lock_id=excluded.lock_id,
    manifest_id=excluded.manifest_id,
    message=excluded.message,
    updated_at=now()
  returning id into v_id;

  return (select to_jsonb(h) from public.ac360_phase2u_pre_ui_handoffs h where h.id=v_id);
end $$;

create or replace function public.ac360_phase2u_final_lock_dashboard(p_org_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.ac360_phase2u_resolve_org(p_org_id);
begin
  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2u',
    'backendOnly', true,
    'uiBuildAllowed', false,
    'requiresUserUiInstructions', true,
    'latestSqlSweep', (select to_jsonb(s) from public.ac360_phase2u_sql_compatibility_sweeps s where s.org_id=v_org_id order by created_at desc limit 1),
    'latestBackendLock', (select to_jsonb(l) from public.ac360_phase2u_final_backend_locks l where l.org_id=v_org_id order by created_at desc limit 1),
    'releaseManifest', (select to_jsonb(m) from public.ac360_phase2u_release_manifests m where m.org_id=v_org_id order by created_at desc limit 1),
    'preUiHandoff', (select to_jsonb(h) from public.ac360_phase2u_pre_ui_handoffs h where h.org_id=v_org_id order by created_at desc limit 1),
    'openAlerts', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from public.ac360_phase2u_alerts a where a.org_id=v_org_id and a.status in ('open','acknowledged')), '[]'::jsonb),
    'requiredNextStep', 'Stop backend generation and collect user visual/UX instructions before any UI/front-end build.'
  );
end $$;

create or replace function public.ac360_resolve_phase2u_alert(p_org_id uuid default null, p_alert_id uuid default null, p_alert_key text default null, p_actor_id uuid default null, p_resolution_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.ac360_phase2u_resolve_org(p_org_id);
  v_id uuid;
begin
  update public.ac360_phase2u_alerts
  set status='resolved',resolved_at=now(),resolved_by=p_actor_id,metadata_json=metadata_json||jsonb_build_object('resolutionNote',p_resolution_note),updated_at=now()
  where org_id=v_org_id
    and (p_alert_id is null or id=p_alert_id)
    and (p_alert_key is null or alert_key=p_alert_key)
    and status <> 'resolved'
  returning id into v_id;

  return jsonb_build_object('ok', true, 'resolvedId', v_id, 'phase', 'phase_2u');
end $$;

-- RLS service role access
alter table public.ac360_phase2u_sql_compatibility_sweeps enable row level security;
alter table public.ac360_phase2u_sql_compatibility_results enable row level security;
alter table public.ac360_phase2u_final_backend_locks enable row level security;
alter table public.ac360_phase2u_final_backend_lock_results enable row level security;
alter table public.ac360_phase2u_release_manifests enable row level security;
alter table public.ac360_phase2u_pre_ui_handoffs enable row level security;
alter table public.ac360_phase2u_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_phase2u_sql_compatibility_sweeps','ac360_phase2u_sql_compatibility_results','ac360_phase2u_final_backend_locks','ac360_phase2u_final_backend_lock_results','ac360_phase2u_release_manifests','ac360_phase2u_pre_ui_handoffs','ac360_phase2u_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
