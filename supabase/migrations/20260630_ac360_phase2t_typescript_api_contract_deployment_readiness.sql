-- AngelCare 360 Phase 2T - TypeScript Build Hardening, API Contract Sweep & Deployment-Readiness Repair
-- Ref: AC360-PH2T-BUILD-HARDENING-API-CONTRACTS-2026-06-30
-- Scope: backend/system-only build hardening gate after Phase 2S. No AC360 front-end/UI pages are introduced.
-- Doctrine: backend-first, guard-first, fail-closed, route contract coverage, deployment readiness before UI instructions.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Phase 2T hardening / contract / readiness tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_phase2t_build_hardening_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  run_key text not null unique,
  run_type text not null default 'typescript_build_hardening',
  status text not null default 'running',
  readiness_score numeric(5,2) not null default 0,
  critical_failures integer not null default 0,
  warning_count integer not null default 0,
  passed_count integer not null default 0,
  failed_count integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (run_type in ('typescript_build_hardening','api_contract_sweep','deployment_readiness','repair_sweep','custom')),
  check (status in ('running','passed','warning','failed','blocked','archived'))
);

create table if not exists public.ac360_phase2t_build_hardening_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  run_id uuid references public.ac360_phase2t_build_hardening_runs(id) on delete cascade,
  check_key text not null,
  check_group text not null default 'typescript',
  severity text not null default 'medium',
  status text not null default 'pending',
  message text not null,
  expected_json jsonb not null default '{}'::jsonb,
  actual_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  created_at timestamptz not null default now(),
  unique(run_id, check_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('pending','passed','warning','failed','blocked','skipped'))
);

create table if not exists public.ac360_phase2t_api_contract_sweeps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  sweep_key text not null unique,
  status text not null default 'running',
  total_routes integer not null default 0,
  covered_routes integer not null default 0,
  failed_routes integer not null default 0,
  warning_routes integer not null default 0,
  strict_routes integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('running','passed','warning','failed','blocked','archived'))
);

create table if not exists public.ac360_phase2t_api_contract_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  sweep_id uuid references public.ac360_phase2t_api_contract_sweeps(id) on delete cascade,
  wiring_key text not null,
  route_path text not null,
  http_method text not null default 'POST',
  action_key text not null,
  feature_key text,
  target_module text,
  enforcement_mode text,
  status text not null default 'pending',
  severity text not null default 'medium',
  message text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  created_at timestamptz not null default now(),
  unique(sweep_id, wiring_key),
  check (http_method in ('GET','POST','PATCH','PUT','DELETE')),
  check (status in ('pending','passed','warning','failed','blocked','skipped')),
  check (severity in ('low','medium','high','critical'))
);

create table if not exists public.ac360_phase2t_deployment_readiness_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  readiness_key text not null unique,
  status text not null default 'evaluating',
  deployment_readiness text not null default 'not_ready',
  backend_ready boolean not null default false,
  ui_build_allowed boolean not null default false,
  readiness_score numeric(5,2) not null default 0,
  blocker_count integer not null default 0,
  warning_count integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(),
  evaluated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('evaluating','passed','warning','failed','blocked','archived')),
  check (deployment_readiness in ('not_ready','backend_ready_pre_ui_locked','ready_for_ui_instruction','blocked','archived'))
);

create table if not exists public.ac360_phase2t_deployment_readiness_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  readiness_run_id uuid references public.ac360_phase2t_deployment_readiness_runs(id) on delete cascade,
  check_key text not null,
  check_group text not null default 'deployment_readiness',
  severity text not null default 'medium',
  status text not null default 'pending',
  message text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  created_at timestamptz not null default now(),
  unique(readiness_run_id, check_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('pending','passed','warning','failed','blocked','skipped'))
);

create table if not exists public.ac360_phase2t_deployment_repairs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  repair_key text not null,
  repair_type text not null default 'typescript',
  status text not null default 'recorded',
  severity text not null default 'medium',
  title text not null,
  description text,
  affected_file text,
  affected_route text,
  affected_action_key text,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  verified_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, repair_key),
  check (repair_type in ('typescript','api_contract','sql_compatibility','guard_wiring','policy','deployment','qa','custom')),
  check (status in ('recorded','in_progress','verified','failed','dismissed','archived')),
  check (severity in ('low','medium','high','critical'))
);

create table if not exists public.ac360_phase2t_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  alert_type text not null default 'build_hardening',
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  related_run_id uuid references public.ac360_phase2t_build_hardening_runs(id) on delete set null,
  related_sweep_id uuid references public.ac360_phase2t_api_contract_sweeps(id) on delete set null,
  related_readiness_id uuid references public.ac360_phase2t_deployment_readiness_runs(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('build_hardening','api_contract','deployment_readiness','typescript','sql','guard_wiring','pre_ui_gate','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','acknowledged','resolved','dismissed','archived'))
);

-- Touch updated_at triggers.
drop trigger if exists trg_ac360_phase2t_build_hardening_runs_updated_at on public.ac360_phase2t_build_hardening_runs;
create trigger trg_ac360_phase2t_build_hardening_runs_updated_at before update on public.ac360_phase2t_build_hardening_runs for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2t_deployment_readiness_runs_updated_at on public.ac360_phase2t_deployment_readiness_runs;
create trigger trg_ac360_phase2t_deployment_readiness_runs_updated_at before update on public.ac360_phase2t_deployment_readiness_runs for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2t_deployment_repairs_updated_at on public.ac360_phase2t_deployment_repairs;
create trigger trg_ac360_phase2t_deployment_repairs_updated_at before update on public.ac360_phase2t_deployment_repairs for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_phase2t_alerts_updated_at on public.ac360_phase2t_alerts;
create trigger trg_ac360_phase2t_alerts_updated_at before update on public.ac360_phase2t_alerts for each row execute function public.ac360_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Registry seeds and action wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,status,metadata_json)
values
('phase2_build_hardening','angelcare_360_phase2_build_hardening','governance','Phase 2 Build Hardening & Deployment Readiness','TypeScript, API contract, guard-wiring and deployment-readiness hardening gate before UI build.','governance',true,false,false,null,0,'active','{"phase":"phase_2t","backendOnly":true,"uiBuildAllowed":false}'::jsonb)
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
('phase2.typescript_hardening.run','phase2_build_hardening','AC360-ENG-44','Run TypeScript build hardening','Run the backend build-hardening checks that must pass before UI work.','phase2.hardening.run',null,0,'block','{"phase":"phase_2t","access_type":"governance"}'::jsonb),
('phase2.api_contract_sweep.run','phase2_build_hardening','AC360-ENG-44','Run API contract sweep','Sweep guarded API route contracts, action registry links and strict enforcement coverage.','phase2.api_contract_sweep.run',null,0,'block','{"phase":"phase_2t","access_type":"governance"}'::jsonb),
('phase2.deployment_readiness.evaluate','phase2_build_hardening','AC360-ENG-44','Evaluate Phase 2 deployment readiness','Evaluate backend deployment readiness while keeping UI build locked.','phase2.deployment_readiness.evaluate',null,0,'block','{"phase":"phase_2t","access_type":"governance"}'::jsonb),
('phase2.deployment_repair.record','phase2_build_hardening','AC360-ENG-44','Record Phase 2 deployment repair','Record a TypeScript/API/SQL/guard-wiring repair and its verification state.','phase2.deployment_repair.record',null,0,'block','{"phase":"phase_2t","access_type":"governance"}'::jsonb),
('phase2.build_alert.resolve','phase2_build_hardening','AC360-ENG-44','Resolve Phase 2 build alert','Resolve a build-hardening, API contract or deployment readiness alert.','phase2.build_alert.resolve',null,0,'block','{"phase":"phase_2t","access_type":"governance"}'::jsonb)
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
('ac360.phase2t.typescript_hardening.run','/api/ac360/phase2-build-hardening/typescript/run','POST','phase2.typescript_hardening.run','phase2_build_hardening','AC360-ENG-44','angelcare_360_phase2_build_hardening','ac360_phase2t_build_hardening_runs','strict','fixed_1','request_or_generated',null,null,'active','Run Phase 2T TypeScript/build hardening checks.','{"phase":"phase_2t","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2t.api_contract_sweep.run','/api/ac360/phase2-build-hardening/api-contracts/sweep','POST','phase2.api_contract_sweep.run','phase2_build_hardening','AC360-ENG-44','angelcare_360_phase2_build_hardening','ac360_phase2t_api_contract_sweeps','strict','fixed_1','request_or_generated',null,null,'active','Run Phase 2T API contract and route wiring sweep.','{"phase":"phase_2t","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2t.deployment_readiness.evaluate','/api/ac360/phase2-build-hardening/deployment-readiness/evaluate','POST','phase2.deployment_readiness.evaluate','phase2_build_hardening','AC360-ENG-44','angelcare_360_phase2_build_hardening','ac360_phase2t_deployment_readiness_runs','strict','fixed_1','request_or_generated',null,null,'active','Evaluate Phase 2T backend deployment readiness before UI instruction gate.','{"phase":"phase_2t","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2t.deployment_repair.record','/api/ac360/phase2-build-hardening/repairs/record','POST','phase2.deployment_repair.record','phase2_build_hardening','AC360-ENG-44','angelcare_360_phase2_build_hardening','ac360_phase2t_deployment_repairs','strict','fixed_1','request_or_generated',null,null,'active','Record and verify a Phase 2T hardening repair.','{"phase":"phase_2t","backendOnly":true,"uiBuildAllowed":false}'::jsonb),
('ac360.phase2t.alert.resolve','/api/ac360/phase2-build-hardening/alerts/resolve','POST','phase2.build_alert.resolve','phase2_build_hardening','AC360-ENG-44','angelcare_360_phase2_build_hardening','ac360_phase2t_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolve a Phase 2T build/deployment alert.','{"phase":"phase_2t","backendOnly":true,"uiBuildAllowed":false}'::jsonb)
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
-- 3. Phase 2T RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_run_phase2t_typescript_hardening(
  p_org_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_run_key text := 'phase2t-ts-' || coalesce(p_org_id::text,'global') || '-' || extract(epoch from clock_timestamp())::bigint || '-' || substr(gen_random_uuid()::text,1,8);
  v_route_count int := 0;
  v_missing_actions int := 0;
  v_missing_features int := 0;
  v_non_strict int := 0;
  v_phase2_modules int := 0;
  v_pre_ui_violations int := 0;
  v_failed int := 0;
  v_warning int := 0;
  v_passed int := 0;
  v_score numeric(5,2) := 0;
  v_status text := 'passed';
begin
  insert into public.ac360_phase2t_build_hardening_runs(org_id,run_key,run_type,status,metadata_json,created_by)
  values(p_org_id,v_run_key,'typescript_build_hardening','running',coalesce(p_metadata,'{}'::jsonb),p_actor_app_user_id)
  returning id into v_run_id;

  select count(*) into v_route_count from public.ac360_app_action_wiring where status='active' and (target_module like 'angelcare_360%' or target_module like 'email_os%' or target_module like 'capital%');
  select count(*) into v_missing_actions
    from public.ac360_app_action_wiring w
    left join public.ac360_action_registry a on a.action_key=w.action_key
    where w.status='active' and a.action_key is null;
  select count(*) into v_missing_features
    from public.ac360_action_registry a
    left join public.ac360_feature_registry f on f.feature_key=a.feature_key
    where (a.action_key like 'school.%' or a.action_key like 'phase2.%' or a.action_key like 'internal.%')
      and f.feature_key is null;
  select count(*) into v_non_strict
    from public.ac360_app_action_wiring
    where status='active' and (target_module like 'angelcare_360%' or target_module like 'email_os%' or target_module like 'capital%') and enforcement_mode <> 'strict';
  select count(*) into v_phase2_modules from public.ac360_phase2_module_coverage_matrix where module_key like '%';
  select count(*) into v_pre_ui_violations from public.ac360_phase2_pre_ui_gates where coalesce(ui_build_allowed,false)=true;

  insert into public.ac360_phase2t_build_hardening_results(org_id,run_id,check_key,check_group,severity,status,message,expected_json,actual_json,remediation_hint)
  values
  (p_org_id,v_run_id,'route_contract_minimum','api_contracts','critical',case when v_route_count >= 150 then 'passed' else 'failed' end,'Active guarded route/action wiring count must remain broad enough for Phase 2 nationwide runtime.','{"minimum":150}'::jsonb,jsonb_build_object('actual',v_route_count),'Run missing phase patches or action wiring repair.'),
  (p_org_id,v_run_id,'missing_action_registry','api_contracts','critical',case when v_missing_actions = 0 then 'passed' else 'failed' end,'Every app action wiring row must resolve to an action registry row.','{"missing":0}'::jsonb,jsonb_build_object('actual',v_missing_actions),'Seed missing ac360_action_registry rows.'),
  (p_org_id,v_run_id,'missing_feature_registry','feature_contracts','critical',case when v_missing_features = 0 then 'passed' else 'failed' end,'Every Phase 2/internal action must resolve to a feature registry row.','{"missing":0}'::jsonb,jsonb_build_object('actual',v_missing_features),'Seed missing ac360_feature_registry rows.'),
  (p_org_id,v_run_id,'strict_enforcement','guard_policy','critical',case when v_non_strict = 0 then 'passed' else 'failed' end,'Production AC360 route wiring must stay strict.','{"non_strict":0}'::jsonb,jsonb_build_object('actual',v_non_strict),'Switch action wiring enforcement_mode to strict.'),
  (p_org_id,v_run_id,'phase2_module_coverage','coverage','high',case when v_phase2_modules >= 19 then 'passed' else 'warning' end,'Phase 2 coverage matrix should include Phase 2A through Phase 2S/2T coverage.','{"minimum":19}'::jsonb,jsonb_build_object('actual',v_phase2_modules),'Refresh Phase 2 coverage matrix.'),
  (p_org_id,v_run_id,'ui_build_lock','pre_ui_gate','critical',case when v_pre_ui_violations = 0 then 'passed' else 'failed' end,'UI build must remain locked until user gives UI/UX instructions.','{"ui_build_allowed":false}'::jsonb,jsonb_build_object('violations',v_pre_ui_violations),'Reset pre-UI gate and wait for user visual instructions.');

  select count(*) filter(where status in ('failed','blocked')),
         count(*) filter(where status='warning'),
         count(*) filter(where status='passed')
    into v_failed,v_warning,v_passed
    from public.ac360_phase2t_build_hardening_results where run_id=v_run_id;

  v_score := greatest(0, round(((v_passed::numeric / greatest(v_passed+v_failed+v_warning,1)) * 100)::numeric,2));
  v_status := case when v_failed > 0 then 'failed' when v_warning > 0 then 'warning' else 'passed' end;

  update public.ac360_phase2t_build_hardening_runs
  set status=v_status, readiness_score=v_score, critical_failures=v_failed, warning_count=v_warning, passed_count=v_passed, failed_count=v_failed,
      completed_at=now(), summary_json=jsonb_build_object('route_count',v_route_count,'missing_actions',v_missing_actions,'missing_features',v_missing_features,'non_strict',v_non_strict,'phase2_modules',v_phase2_modules,'ui_build_violations',v_pre_ui_violations)
  where id=v_run_id;

  if v_failed > 0 then
    insert into public.ac360_phase2t_alerts(org_id,alert_key,alert_type,severity,status,title,message,related_run_id,metadata_json)
    values(p_org_id,'phase2t-build-hardening-'||v_run_id,'build_hardening','critical','open','Phase 2T build hardening failed','One or more TypeScript/API contract hardening checks failed.',v_run_id,jsonb_build_object('run_key',v_run_key))
    on conflict(org_id,alert_key) do nothing;
  end if;

  return jsonb_build_object('ok',true,'runId',v_run_id,'runKey',v_run_key,'status',v_status,'readinessScore',v_score,'criticalFailures',v_failed,'warnings',v_warning,'passed',v_passed,'summary',(select summary_json from public.ac360_phase2t_build_hardening_runs where id=v_run_id));
end;
$$;

create or replace function public.ac360_run_phase2t_api_contract_sweep(
  p_org_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sweep_id uuid;
  v_sweep_key text := 'phase2t-api-' || coalesce(p_org_id::text,'global') || '-' || extract(epoch from clock_timestamp())::bigint || '-' || substr(gen_random_uuid()::text,1,8);
  v_total int := 0;
  v_failed int := 0;
  v_warning int := 0;
  v_passed int := 0;
  v_strict int := 0;
  v_status text := 'passed';
begin
  insert into public.ac360_phase2t_api_contract_sweeps(org_id,sweep_key,status,metadata_json,created_by)
  values(p_org_id,v_sweep_key,'running',coalesce(p_metadata,'{}'::jsonb),p_actor_app_user_id)
  returning id into v_sweep_id;

  insert into public.ac360_phase2t_api_contract_results(org_id,sweep_id,wiring_key,route_path,http_method,action_key,feature_key,target_module,enforcement_mode,status,severity,message,evidence_json,remediation_hint)
  select p_org_id,
         v_sweep_id,
         w.wiring_key,
         w.route_path,
         w.http_method,
         w.action_key,
         w.feature_key,
         w.target_module,
         w.enforcement_mode,
         case
           when a.action_key is null then 'failed'
           when f.feature_key is null then 'failed'
           when w.enforcement_mode <> 'strict' then 'failed'
           when w.route_path not like '/api/%' then 'warning'
           else 'passed'
         end as status,
         case
           when a.action_key is null or f.feature_key is null or w.enforcement_mode <> 'strict' then 'critical'
           when w.route_path not like '/api/%' then 'medium'
           else 'low'
         end as severity,
         case
           when a.action_key is null then 'Missing action registry row for wiring key.'
           when f.feature_key is null then 'Missing feature registry row for action contract.'
           when w.enforcement_mode <> 'strict' then 'Route contract is not strict.'
           when w.route_path not like '/api/%' then 'Route path is not an API path.'
           else 'Route contract is covered and strict.'
         end as message,
         jsonb_build_object('routePath',w.route_path,'httpMethod',w.http_method,'actionExists',a.action_key is not null,'featureExists',f.feature_key is not null,'enforcementMode',w.enforcement_mode),
         'Repair static action wiring, registry seeds, or route path contract.'
  from public.ac360_app_action_wiring w
  left join public.ac360_action_registry a on a.action_key=w.action_key
  left join public.ac360_feature_registry f on f.feature_key=coalesce(w.feature_key,a.feature_key)
  where w.status='active' and (w.target_module like 'angelcare_360%' or w.target_module like 'email_os%' or w.target_module like 'capital%');

  select count(*),
         count(*) filter(where status in ('failed','blocked')),
         count(*) filter(where status='warning'),
         count(*) filter(where status='passed')
    into v_total,v_failed,v_warning,v_passed
    from public.ac360_phase2t_api_contract_results where sweep_id=v_sweep_id;
  select count(*) into v_strict from public.ac360_phase2t_api_contract_results where sweep_id=v_sweep_id and enforcement_mode='strict';

  v_status := case when v_failed > 0 then 'failed' when v_warning > 0 then 'warning' else 'passed' end;

  update public.ac360_phase2t_api_contract_sweeps
  set status=v_status,total_routes=v_total,covered_routes=v_passed,failed_routes=v_failed,warning_routes=v_warning,strict_routes=v_strict,completed_at=now(),
      summary_json=jsonb_build_object('totalRoutes',v_total,'coveredRoutes',v_passed,'failedRoutes',v_failed,'warningRoutes',v_warning,'strictRoutes',v_strict)
  where id=v_sweep_id;

  if v_failed > 0 then
    insert into public.ac360_phase2t_alerts(org_id,alert_key,alert_type,severity,status,title,message,related_sweep_id,metadata_json)
    values(p_org_id,'phase2t-api-contract-'||v_sweep_id,'api_contract','critical','open','Phase 2T API contract sweep failed','One or more guarded API route contracts failed.',v_sweep_id,jsonb_build_object('sweep_key',v_sweep_key))
    on conflict(org_id,alert_key) do nothing;
  end if;

  return jsonb_build_object('ok',true,'sweepId',v_sweep_id,'sweepKey',v_sweep_key,'status',v_status,'totalRoutes',v_total,'coveredRoutes',v_passed,'failedRoutes',v_failed,'warningRoutes',v_warning,'strictRoutes',v_strict);
end;
$$;

create or replace function public.ac360_evaluate_phase2t_deployment_readiness(
  p_org_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text := 'phase2t-readiness-' || coalesce(p_org_id::text,'global') || '-' || extract(epoch from clock_timestamp())::bigint || '-' || substr(gen_random_uuid()::text,1,8);
  v_latest_hardening public.ac360_phase2t_build_hardening_runs%rowtype;
  v_latest_sweep public.ac360_phase2t_api_contract_sweeps%rowtype;
  v_latest_pre_ui public.ac360_phase2_pre_ui_gates%rowtype;
  v_blockers int := 0;
  v_warnings int := 0;
  v_score numeric(5,2) := 0;
  v_status text := 'passed';
  v_readiness text := 'backend_ready_pre_ui_locked';
begin
  select * into v_latest_hardening from public.ac360_phase2t_build_hardening_runs where (p_org_id is null or org_id=p_org_id) order by created_at desc limit 1;
  select * into v_latest_sweep from public.ac360_phase2t_api_contract_sweeps where (p_org_id is null or org_id=p_org_id) order by created_at desc limit 1;
  select * into v_latest_pre_ui from public.ac360_phase2_pre_ui_gates where (p_org_id is null or org_id=p_org_id) order by created_at desc limit 1;

  if v_latest_hardening.id is null or v_latest_hardening.status not in ('passed','warning') then v_blockers := v_blockers + 1; end if;
  if v_latest_sweep.id is null or v_latest_sweep.status not in ('passed','warning') then v_blockers := v_blockers + 1; end if;
  if v_latest_pre_ui.id is null then v_warnings := v_warnings + 1; end if;
  if v_latest_pre_ui.ui_build_allowed is true then v_blockers := v_blockers + 1; end if;
  if v_latest_hardening.status='warning' then v_warnings := v_warnings + 1; end if;
  if v_latest_sweep.status='warning' then v_warnings := v_warnings + 1; end if;

  v_score := case when v_blockers > 0 then 60 when v_warnings > 0 then 90 else 100 end;
  v_status := case when v_blockers > 0 then 'failed' when v_warnings > 0 then 'warning' else 'passed' end;
  v_readiness := case when v_blockers > 0 then 'blocked' when v_warnings > 0 then 'backend_ready_pre_ui_locked' else 'ready_for_ui_instruction' end;

  insert into public.ac360_phase2t_deployment_readiness_runs(org_id,readiness_key,status,deployment_readiness,backend_ready,ui_build_allowed,readiness_score,blocker_count,warning_count,summary_json,metadata_json,evaluated_by)
  values(p_org_id,v_key,v_status,v_readiness,(v_blockers=0),false,v_score,v_blockers,v_warnings,
         jsonb_build_object('hardeningRunId',v_latest_hardening.id,'hardeningStatus',v_latest_hardening.status,'apiSweepId',v_latest_sweep.id,'apiSweepStatus',v_latest_sweep.status,'preUiGateId',v_latest_pre_ui.id,'preUiStatus',v_latest_pre_ui.status,'uiBuildAllowed',coalesce(v_latest_pre_ui.ui_build_allowed,false)),
         coalesce(p_metadata,'{}'::jsonb),p_actor_app_user_id)
  returning id into v_id;

  insert into public.ac360_phase2t_deployment_readiness_results(org_id,readiness_run_id,check_key,check_group,severity,status,message,evidence_json,remediation_hint)
  values
  (p_org_id,v_id,'hardening_run_status','build','critical',case when v_latest_hardening.id is not null and v_latest_hardening.status in ('passed','warning') then 'passed' else 'failed' end,'Latest Phase 2T build hardening run must exist and be non-failing.',jsonb_build_object('runId',v_latest_hardening.id,'status',v_latest_hardening.status),'Run /api/ac360/phase2-build-hardening/typescript/run and repair blockers.'),
  (p_org_id,v_id,'api_contract_sweep_status','api_contracts','critical',case when v_latest_sweep.id is not null and v_latest_sweep.status in ('passed','warning') then 'passed' else 'failed' end,'Latest Phase 2T API contract sweep must exist and be non-failing.',jsonb_build_object('sweepId',v_latest_sweep.id,'status',v_latest_sweep.status),'Run /api/ac360/phase2-build-hardening/api-contracts/sweep and repair blockers.'),
  (p_org_id,v_id,'pre_ui_lock_status','pre_ui_gate','critical',case when coalesce(v_latest_pre_ui.ui_build_allowed,false)=false then 'passed' else 'failed' end,'UI build must remain locked until explicit user UX instructions.',jsonb_build_object('preUiGateId',v_latest_pre_ui.id,'uiBuildAllowed',coalesce(v_latest_pre_ui.ui_build_allowed,false)),'Reset pre-UI gate and ask user for UI/UX instructions before UI work.'),
  (p_org_id,v_id,'backend_ready_status','deployment','high',case when v_blockers=0 then 'passed' else 'failed' end,'Backend runtime should be deployable before front-end build begins.',jsonb_build_object('blockers',v_blockers,'warnings',v_warnings,'readiness',v_readiness),'Repair blockers, rerun hardening and reevaluate readiness.');

  if v_blockers > 0 then
    insert into public.ac360_phase2t_alerts(org_id,alert_key,alert_type,severity,status,title,message,related_readiness_id,metadata_json)
    values(p_org_id,'phase2t-deployment-readiness-'||v_id,'deployment_readiness','critical','open','Phase 2T deployment readiness blocked','Backend deployment readiness has blockers.',v_id,jsonb_build_object('readinessKey',v_key))
    on conflict(org_id,alert_key) do nothing;
  end if;

  return jsonb_build_object('ok',true,'readinessRunId',v_id,'readinessKey',v_key,'status',v_status,'deploymentReadiness',v_readiness,'backendReady',(v_blockers=0),'uiBuildAllowed',false,'readinessScore',v_score,'blockers',v_blockers,'warnings',v_warnings);
end;
$$;

create or replace function public.ac360_record_phase2t_deployment_repair(
  p_org_id uuid default null,
  p_repair_type text default 'typescript',
  p_title text default 'Phase 2T repair',
  p_description text default null,
  p_affected_file text default null,
  p_affected_route text default null,
  p_affected_action_key text default null,
  p_verified boolean default false,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text := 'phase2t-repair-' || coalesce(p_org_id::text,'global') || '-' || regexp_replace(lower(coalesce(p_repair_type,'custom')), '[^a-z0-9]+', '-', 'g') || '-' || substr(md5(coalesce(p_title,'repair')||coalesce(p_affected_file,'')||coalesce(p_affected_route,'')),1,10);
begin
  insert into public.ac360_phase2t_deployment_repairs(org_id,repair_key,repair_type,status,severity,title,description,affected_file,affected_route,affected_action_key,verified,verified_at,created_by,metadata_json)
  values(p_org_id,v_key,coalesce(p_repair_type,'custom'),case when p_verified then 'verified' else 'recorded' end,'medium',coalesce(p_title,'Phase 2T repair'),p_description,p_affected_file,p_affected_route,p_affected_action_key,coalesce(p_verified,false),case when p_verified then now() else null end,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,repair_key) do update set
    repair_type=excluded.repair_type,
    status=excluded.status,
    title=excluded.title,
    description=excluded.description,
    affected_file=excluded.affected_file,
    affected_route=excluded.affected_route,
    affected_action_key=excluded.affected_action_key,
    verified=excluded.verified,
    verified_at=excluded.verified_at,
    metadata_json=public.ac360_phase2t_deployment_repairs.metadata_json||excluded.metadata_json,
    updated_at=now()
  returning id into v_id;

  return jsonb_build_object('ok',true,'repairId',v_id,'repairKey',v_key,'verified',coalesce(p_verified,false));
end;
$$;

create or replace function public.ac360_phase2t_build_hardening_dashboard(p_org_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest_run jsonb;
  v_latest_sweep jsonb;
  v_latest_readiness jsonb;
  v_open_alerts int := 0;
  v_verified_repairs int := 0;
begin
  select coalesce(to_jsonb(r),'{}'::jsonb) into v_latest_run from public.ac360_phase2t_build_hardening_runs r where (p_org_id is null or r.org_id=p_org_id) order by created_at desc limit 1;
  select coalesce(to_jsonb(s),'{}'::jsonb) into v_latest_sweep from public.ac360_phase2t_api_contract_sweeps s where (p_org_id is null or s.org_id=p_org_id) order by created_at desc limit 1;
  select coalesce(to_jsonb(d),'{}'::jsonb) into v_latest_readiness from public.ac360_phase2t_deployment_readiness_runs d where (p_org_id is null or d.org_id=p_org_id) order by created_at desc limit 1;
  select count(*) into v_open_alerts from public.ac360_phase2t_alerts where (p_org_id is null or org_id=p_org_id) and status='open';
  select count(*) into v_verified_repairs from public.ac360_phase2t_deployment_repairs where (p_org_id is null or org_id=p_org_id) and verified=true;

  return jsonb_build_object(
    'ok',true,
    'phase','phase_2t_build_hardening_api_contracts_deployment_readiness',
    'backendOnly',true,
    'uiBuildAllowed',false,
    'latestBuildHardeningRun',coalesce(v_latest_run,'{}'::jsonb),
    'latestApiContractSweep',coalesce(v_latest_sweep,'{}'::jsonb),
    'latestDeploymentReadiness',coalesce(v_latest_readiness,'{}'::jsonb),
    'openAlerts',v_open_alerts,
    'verifiedRepairs',v_verified_repairs
  );
end;
$$;

create or replace function public.ac360_resolve_phase2t_alert(
  p_org_id uuid default null,
  p_alert_id uuid default null,
  p_alert_key text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.ac360_phase2t_alerts
  set status='resolved', resolved_at=now(), resolved_by=p_actor_app_user_id, metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where (p_org_id is null or org_id=p_org_id)
    and (p_alert_id is not null and id=p_alert_id or p_alert_id is null and p_alert_key is not null and alert_key=p_alert_key)
  returning id into v_id;

  return jsonb_build_object('ok',v_id is not null,'alertId',v_id,'status',case when v_id is null then 'not_found' else 'resolved' end);
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. RLS service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_phase2t_build_hardening_runs enable row level security;
alter table public.ac360_phase2t_build_hardening_results enable row level security;
alter table public.ac360_phase2t_api_contract_sweeps enable row level security;
alter table public.ac360_phase2t_api_contract_results enable row level security;
alter table public.ac360_phase2t_deployment_readiness_runs enable row level security;
alter table public.ac360_phase2t_deployment_readiness_results enable row level security;
alter table public.ac360_phase2t_deployment_repairs enable row level security;
alter table public.ac360_phase2t_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_phase2t_build_hardening_runs','ac360_phase2t_build_hardening_results','ac360_phase2t_api_contract_sweeps','ac360_phase2t_api_contract_results','ac360_phase2t_deployment_readiness_runs','ac360_phase2t_deployment_readiness_results','ac360_phase2t_deployment_repairs','ac360_phase2t_alerts'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
