
-- AngelCare 360 Phase 1E - Production Policy Enforcement & Safety Lock
-- Strictly remains inside Phase 1 Foundation.
-- Purpose: harden fail-closed behavior, override governance, blocked-action UX,
-- audit visibility and route coverage before Phase 2 school operations.

begin;

create table if not exists public.ac360_policy_locks (
  id uuid primary key default gen_random_uuid(),
  lock_key text not null unique,
  system_group text not null default 'policy_enforcement',
  enforcement_scope text not null default 'action',
  status text not null default 'active',
  severity text not null default 'warning',
  title text not null,
  doctrine_step text not null,
  target_action_key text references public.ac360_action_registry(action_key) on delete cascade,
  target_feature_key text references public.ac360_feature_registry(feature_key) on delete cascade,
  target_meter_key text references public.ac360_usage_meters(meter_key) on delete set null,
  behavior text not null default 'block',
  failsafe_mode text not null default 'fail_closed',
  override_allowed boolean not null default false,
  override_permission_key text,
  review_cadence text not null default 'weekly',
  sort_order integer not null default 100,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active','paused','archived')),
  check (severity in ('info','warning','critical')),
  check (behavior in ('block','warn','read_only','suspend','require_override')),
  check (failsafe_mode in ('fail_closed','fail_open_read_only','advisory'))
);

create table if not exists public.ac360_policy_override_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  actor_app_user_id uuid,
  action_key text references public.ac360_action_registry(action_key) on delete set null,
  feature_key text references public.ac360_feature_registry(feature_key) on delete set null,
  meter_key text references public.ac360_usage_meters(meter_key) on delete set null,
  route_path text,
  quantity numeric not null default 1,
  requested_behavior text not null default 'single_action_override',
  reason text not null,
  status text not null default 'requested',
  expires_at timestamptz,
  decided_by_app_user_id uuid,
  decided_at timestamptz,
  decision_reason text,
  guard_decision_id uuid references public.ac360_guard_decisions(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('requested','approved','denied','expired','used','cancelled')),
  check (requested_behavior in ('single_action_override','temporary_unlock','read_only_unlock','billing_admin_override'))
);

create table if not exists public.ac360_policy_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete set null,
  actor_app_user_id uuid,
  event_key text not null,
  action_key text references public.ac360_action_registry(action_key) on delete set null,
  feature_key text references public.ac360_feature_registry(feature_key) on delete set null,
  meter_key text references public.ac360_usage_meters(meter_key) on delete set null,
  route_path text,
  http_method text,
  severity text not null default 'info',
  status text not null default 'open',
  message text not null,
  guard_decision_id uuid references public.ac360_guard_decisions(id) on delete set null,
  override_request_id uuid references public.ac360_policy_override_requests(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  acknowledged_by_app_user_id uuid,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  check (severity in ('info','warning','critical')),
  check (status in ('open','acknowledged','resolved','archived'))
);

create table if not exists public.ac360_route_coverage_audits (
  id uuid primary key default gen_random_uuid(),
  route_path text not null,
  http_method text not null default 'POST',
  target_module text not null default 'unknown',
  expected_action_key text references public.ac360_action_registry(action_key) on delete set null,
  coverage_status text not null default 'expected',
  enforcement_mode text not null default 'strict',
  last_scanned_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(route_path, http_method),
  check (coverage_status in ('covered','expected','missing','shadow','not_applicable')),
  check (enforcement_mode in ('strict','advisory','shadow','disabled'))
);

create table if not exists public.ac360_blocked_action_messages (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null unique,
  title text not null,
  body text not null,
  primary_cta_label text not null default 'Open Billing Center',
  primary_cta_href text not null default '/angelcare-360/billing-center',
  secondary_cta_label text default 'Request override',
  secondary_cta_href text default '/angelcare-360/policy-lock',
  severity text not null default 'warning',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('info','warning','critical')),
  check (status in ('active','archived'))
);

create index if not exists idx_ac360_policy_locks_status_target on public.ac360_policy_locks(status, target_action_key, target_feature_key, target_meter_key);
create index if not exists idx_ac360_override_org_status on public.ac360_policy_override_requests(org_id, status, expires_at desc);
create index if not exists idx_ac360_policy_events_org_created on public.ac360_policy_events(org_id, created_at desc);
create index if not exists idx_ac360_policy_events_action on public.ac360_policy_events(action_key, severity, status);
create index if not exists idx_ac360_route_coverage_status on public.ac360_route_coverage_audits(coverage_status, enforcement_mode, target_module);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_policy_locks' and policyname='ac360_policy_locks_service_role_all') then
    create policy ac360_policy_locks_service_role_all on public.ac360_policy_locks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_policy_override_requests' and policyname='ac360_policy_override_service_role_all') then
    create policy ac360_policy_override_service_role_all on public.ac360_policy_override_requests for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_policy_events' and policyname='ac360_policy_events_service_role_all') then
    create policy ac360_policy_events_service_role_all on public.ac360_policy_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_route_coverage_audits' and policyname='ac360_route_coverage_service_role_all') then
    create policy ac360_route_coverage_service_role_all on public.ac360_route_coverage_audits for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ac360_blocked_action_messages' and policyname='ac360_blocked_messages_service_role_all') then
    create policy ac360_blocked_messages_service_role_all on public.ac360_blocked_action_messages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

alter table public.ac360_policy_locks enable row level security;
alter table public.ac360_policy_override_requests enable row level security;
alter table public.ac360_policy_events enable row level security;
alter table public.ac360_route_coverage_audits enable row level security;
alter table public.ac360_blocked_action_messages enable row level security;

drop trigger if exists trg_ac360_policy_locks_updated_at on public.ac360_policy_locks;
create trigger trg_ac360_policy_locks_updated_at before update on public.ac360_policy_locks for each row execute function public.ac360_touch_updated_at();

drop trigger if exists trg_ac360_policy_override_updated_at on public.ac360_policy_override_requests;
create trigger trg_ac360_policy_override_updated_at before update on public.ac360_policy_override_requests for each row execute function public.ac360_touch_updated_at();

drop trigger if exists trg_ac360_route_coverage_updated_at on public.ac360_route_coverage_audits;
create trigger trg_ac360_route_coverage_updated_at before update on public.ac360_route_coverage_audits for each row execute function public.ac360_touch_updated_at();

drop trigger if exists trg_ac360_blocked_messages_updated_at on public.ac360_blocked_action_messages;
create trigger trg_ac360_blocked_messages_updated_at before update on public.ac360_blocked_action_messages for each row execute function public.ac360_touch_updated_at();

-- Phase 1E action registry extension.
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('policy.preflight','billing_center','AC360-ENG-26','Policy preflight','Checks strict policy safety before a guarded action executes.','billing_center',null,0,'block','{"phase":"phase_1e","safety_lock":true}'::jsonb),
('policy.override_request','billing_center','AC360-ENG-27','Policy override request','Creates a controlled override request for a blocked action.','billing_center',null,0,'block','{"phase":"phase_1e","requires_reason":true}'::jsonb),
('policy.override_decide','billing_center','AC360-ENG-27','Policy override decision','Approves or denies a controlled override request.','billing_center',null,0,'block','{"phase":"phase_1e","admin_only":true}'::jsonb),
('policy.event.record','billing_center','AC360-ENG-10','Policy event record','Records blocked-action UX/safety events for audit visibility.','billing_center',null,0,'block','{"phase":"phase_1e","audit":true}'::jsonb),
('policy.safety_reconcile','billing_center','AC360-ENG-41','Policy safety reconciliation','Reconciles blocked decisions, restrictions, route coverage and recommendation safety.','billing_center',null,0,'block','{"phase":"phase_1e","critical":true}'::jsonb),
('route_coverage.scan','billing_center','AC360-ENG-26','Route coverage scan','Scans expected guarded routes and records strict coverage status.','billing_center',null,0,'block','{"phase":"phase_1e","coverage":true}'::jsonb)
on conflict (action_key) do update set
  label=excluded.label,
  description=excluded.description,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json;

-- Route/action wiring extension for safety lock endpoints.
insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table, enforcement_mode, quantity_strategy, idempotency_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.policy.preflight','/api/ac360/policy/preflight','POST','policy.preflight','billing_center','AC360-ENG-26','angelcare_360','ac360_policy_events','strict','fixed_1','request_or_generated',null,'active','Performs Phase 1E fail-closed policy preflight before serious actions.','{"phase":"phase_1e","safety_lock":true}'::jsonb),
('ac360.policy.override.request','/api/ac360/policy/override','POST','policy.override_request','billing_center','AC360-ENG-27','angelcare_360','ac360_policy_override_requests','strict','fixed_1','request_or_generated',null,'active','Creates admin-visible override request without bypassing data preservation rules.','{"phase":"phase_1e","override":true}'::jsonb),
('ac360.policy.override.decide','/api/ac360/policy/override','PATCH','policy.override_decide','billing_center','AC360-ENG-27','angelcare_360','ac360_policy_override_requests','strict','fixed_1','request_or_generated',null,'active','Approves or denies a safety override with full audit.','{"phase":"phase_1e","admin_only":true}'::jsonb),
('ac360.policy.events.record','/api/ac360/policy/events','POST','policy.event.record','billing_center','AC360-ENG-10','angelcare_360','ac360_policy_events','strict','fixed_1','request_or_generated',null,'active','Records standardized blocked-action UX and safety events.','{"phase":"phase_1e","audit":true}'::jsonb),
('ac360.policy.reconcile','/api/ac360/policy-center','POST','policy.safety_reconcile','billing_center','AC360-ENG-41','angelcare_360','ac360_policy_events','strict','fixed_1','request_or_generated',null,'active','Runs Phase 1E safety reconciliation before Phase 2 modules.','{"phase":"phase_1e","critical":true}'::jsonb),
('ac360.route_coverage.scan','/api/ac360/route-coverage/scan','POST','route_coverage.scan','billing_center','AC360-ENG-26','angelcare_360','ac360_route_coverage_audits','strict','fixed_1','request_or_generated',null,'active','Refreshes expected route/action coverage status.','{"phase":"phase_1e","coverage":true}'::jsonb)
on conflict (wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json;

insert into public.ac360_policy_locks(lock_key, system_group, enforcement_scope, status, severity, title, doctrine_step, target_action_key, target_feature_key, target_meter_key, behavior, failsafe_mode, override_allowed, override_permission_key, review_cadence, sort_order, metadata_json) values
('phase1e.fail_closed_unknown_action','policy_enforcement','action','active','critical','Unknown production actions must fail closed','action registry → entitlement → allow/block',null,null,null,'block','fail_closed',false,'ac360.policy.override','weekly',10,'{"doctrine":"Every serious action must be registered before execution.","global_unknown_guard":true}'::jsonb),
('phase1e.block_payment_overdue_actions','policy_enforcement','restriction','active','critical','Overdue billing restrictions must block premium execution','subscription → restrictions → allow/block',null,'billing_center',null,'block','fail_closed',true,'ac360.policy.override','daily',20,'{"doctrine":"Payment and lifecycle restrictions are not advisory.","data_preservation":"read_only_not_delete"}'::jsonb),
('phase1e.credits_actions_require_wallet','policy_enforcement','meter','active','warning','Credit-metered actions require wallet validation','capacity/usage/credits → execute → record usage',null,null,'automation_credit','require_override','fail_closed',true,'ac360.policy.override','weekly',30,'{"doctrine":"Credit cost actions need wallet/top-up clarity before execution."}'::jsonb),
('phase1e.route_wiring_required','policy_enforcement','route','active','warning','Serious routes must be present in AC360 action wiring','route → action registry → guard → audit',null,null,null,'warn','advisory',false,null,'weekly',40,'{"doctrine":"Route coverage must be visible before national deployment."}'::jsonb),
('phase1e.cancel_preserve_data','policy_enforcement','data_preservation','active','critical','Cancellation must preserve data and convert premium modules to read-only','cancel → preserve → restrict → audit','addon.cancel',null,null,'warn','advisory',false,null,'monthly',50,'{"doctrine":"Cancel access, never destroy data automatically."}'::jsonb)
on conflict (lock_key) do update set
  status=excluded.status,
  severity=excluded.severity,
  title=excluded.title,
  doctrine_step=excluded.doctrine_step,
  behavior=excluded.behavior,
  failsafe_mode=excluded.failsafe_mode,
  override_allowed=excluded.override_allowed,
  override_permission_key=excluded.override_permission_key,
  metadata_json=public.ac360_policy_locks.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_blocked_action_messages(decision_key, title, body, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, severity, status, metadata_json) values
('policy_locked','Action locked by AngelCare 360 policy','This action is blocked because it would bypass the production billing, entitlement, restriction or data-preservation doctrine. Review the policy lock or request an authorized override.','Open Policy Lock','/angelcare-360/policy-lock','Request override','/angelcare-360/policy-lock','critical','active','{"phase":"phase_1e"}'::jsonb),
('insufficient_credits','AngelCare Credits required','This action needs additional AngelCare Credits or a Sérénité bundle before execution. Top up credits or upgrade comfort coverage.','Open Billing Center','/angelcare-360/billing-center','Open Policy Lock','/angelcare-360/policy-lock','warning','active','{"phase":"phase_1e"}'::jsonb),
('capacity_exceeded','Package limit reached','The current package limit has been reached. Add capacity, activate a Growth Menu add-on, or upgrade the package before continuing.','Open Billing Center','/angelcare-360/billing-center','Request override','/angelcare-360/policy-lock','warning','active','{"phase":"phase_1e"}'::jsonb),
('billing_restricted','Account restricted','The organization has an active billing or lifecycle restriction. Resolve the invoice, grace period, package limit, or restriction before continuing.','Open Billing Center','/angelcare-360/billing-center','Request override','/angelcare-360/policy-lock','critical','active','{"phase":"phase_1e"}'::jsonb),
('unknown_wiring','Action wiring missing','This route or action is not yet mapped to AC360 action wiring. It must be registered before production execution.','Open Action Wiring','/angelcare-360/action-wiring','Open Guardrails','/angelcare-360/guardrails','critical','active','{"phase":"phase_1e"}'::jsonb)
on conflict (decision_key) do update set
  title=excluded.title,
  body=excluded.body,
  primary_cta_label=excluded.primary_cta_label,
  primary_cta_href=excluded.primary_cta_href,
  secondary_cta_label=excluded.secondary_cta_label,
  secondary_cta_href=excluded.secondary_cta_href,
  severity=excluded.severity,
  status=excluded.status,
  updated_at=now();

-- Expected route coverage seeds from Phase 1D + 1E.
insert into public.ac360_route_coverage_audits(route_path, http_method, target_module, expected_action_key, coverage_status, enforcement_mode, metadata_json) values
('/api/ac360/addons','POST','angelcare_360','addon.activate','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/ac360/addons','DELETE','angelcare_360','addon.cancel','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/ac360/credits/topup','POST','angelcare_360','credits.topup','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/ac360/invoices/generate','POST','angelcare_360','invoice.generate','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/ac360/lifecycle/reconcile','POST','angelcare_360','lifecycle.reconcile','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/ac360/capacity/snapshot','POST','angelcare_360','capacity.measure','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/email-os/compose/send','POST','email_os','communication.email_send','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/email-os/ai-assist','POST','email_os','ai.message_generate','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/email-os/compose/attachments','POST','email_os','document.attachment_register','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/capital-command-center/tasks','POST','capital_command_center','operations.task_create','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/capital-command-center/tasks/import','POST','capital_command_center','operations.task_import','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/tasks','PATCH','revenue_tasks','operations.task_update','covered','strict','{"phase":"phase_1d"}'::jsonb),
('/api/ac360/policy/preflight','POST','angelcare_360','policy.preflight','covered','strict','{"phase":"phase_1e"}'::jsonb),
('/api/ac360/policy/override','POST','angelcare_360','policy.override_request','covered','strict','{"phase":"phase_1e"}'::jsonb),
('/api/ac360/policy/override','PATCH','angelcare_360','policy.override_decide','covered','strict','{"phase":"phase_1e"}'::jsonb),
('/api/ac360/policy/events','POST','angelcare_360','policy.event.record','covered','strict','{"phase":"phase_1e"}'::jsonb),
('/api/ac360/policy-center','POST','angelcare_360','policy.safety_reconcile','covered','strict','{"phase":"phase_1e"}'::jsonb),
('/api/ac360/route-coverage/scan','POST','angelcare_360','route_coverage.scan','covered','strict','{"phase":"phase_1e"}'::jsonb)
on conflict (route_path, http_method) do update set
  target_module=excluded.target_module,
  expected_action_key=excluded.expected_action_key,
  coverage_status=excluded.coverage_status,
  enforcement_mode=excluded.enforcement_mode,
  last_scanned_at=now(),
  metadata_json=public.ac360_route_coverage_audits.metadata_json || excluded.metadata_json,
  updated_at=now();

create or replace function public.ac360_create_policy_event(
  p_org_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_event_key text default 'policy.event',
  p_action_key text default null,
  p_feature_key text default null,
  p_meter_key text default null,
  p_route_path text default null,
  p_http_method text default null,
  p_severity text default 'warning',
  p_status text default 'open',
  p_message text default 'AC360 policy event recorded.',
  p_guard_decision_id uuid default null,
  p_override_request_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_severity text := case when p_severity in ('info','warning','critical') then p_severity else 'warning' end;
  v_status text := case when p_status in ('open','acknowledged','resolved','archived') then p_status else 'open' end;
begin
  insert into public.ac360_policy_events(org_id, actor_app_user_id, event_key, action_key, feature_key, meter_key, route_path, http_method, severity, status, message, guard_decision_id, override_request_id, metadata_json)
  values (
    p_org_id,
    p_actor_app_user_id,
    coalesce(nullif(p_event_key,''),'policy.event'),
    case when exists (select 1 from public.ac360_action_registry ar where ar.action_key = nullif(p_action_key,'')) then nullif(p_action_key,'') else null end,
    case when exists (select 1 from public.ac360_feature_registry fr where fr.feature_key = nullif(p_feature_key,'')) then nullif(p_feature_key,'') else null end,
    case when exists (select 1 from public.ac360_usage_meters um where um.meter_key = nullif(p_meter_key,'')) then nullif(p_meter_key,'') else null end,
    nullif(p_route_path,''),
    nullif(p_http_method,''),
    v_severity,
    v_status,
    coalesce(nullif(p_message,''),'AC360 policy event recorded.'),
    p_guard_decision_id,
    p_override_request_id,
    coalesce(p_metadata,'{}'::jsonb)
  )
  returning id into v_id;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-10', 'policy.event.recorded', p_action_key, 'policy_event', v_id, case when v_severity='critical' then 'warning' else 'success' end, case when v_severity='critical' then 'critical' else v_severity end, p_actor_app_user_id, null, jsonb_build_object('event_key',p_event_key,'route_path',p_route_path,'http_method',p_http_method) || coalesce(p_metadata,'{}'::jsonb));

  return jsonb_build_object('ok',true,'event_id',v_id,'severity',v_severity,'status',v_status);
end;
$$;

create or replace function public.ac360_resolve_policy_safety(
  p_org_id uuid,
  p_action_key text,
  p_feature_key text default null,
  p_meter_key text default null,
  p_route_path text default null,
  p_http_method text default null,
  p_quantity numeric default 1,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_action record;
  v_lock record;
  v_restriction record;
  v_override record;
  v_wiring record;
  v_reason text;
  v_source text := 'policy';
  v_event jsonb;
begin
  if p_org_id is null then
    return jsonb_build_object('ok',false,'allowed',false,'decision','organization_required','reason','AC360 policy safety requires an organization.','guard_stage','policy_context','failsafe','fail_closed');
  end if;
  if coalesce(nullif(p_action_key,''),'') = '' then
    return jsonb_build_object('ok',false,'allowed',false,'decision','action_required','reason','AC360 policy safety requires action_key.','guard_stage','policy_validation','failsafe','fail_closed');
  end if;

  select ar.*, fr.feature_key as resolved_feature_key
    into v_action
  from public.ac360_action_registry ar
  left join public.ac360_feature_registry fr on fr.feature_key = ar.feature_key
  where ar.action_key = p_action_key
  limit 1;

  if v_action.action_key is null then
    v_reason := 'Action is not registered. Phase 1E safety lock fails closed until action registry and route wiring are complete.';
    v_event := public.ac360_create_policy_event(p_org_id, p_actor_app_user_id, 'policy.unknown_action.blocked', p_action_key, p_feature_key, p_meter_key, p_route_path, p_http_method, 'critical', 'open', v_reason, null, null, coalesce(p_metadata,'{}'::jsonb));
    return jsonb_build_object('ok',false,'allowed',false,'decision','unknown_action','reason',v_reason,'guard_stage','policy_action_registry','failsafe','fail_closed','event',v_event);
  end if;

  if p_route_path is not null then
    select * into v_wiring
    from public.ac360_app_action_wiring
    where route_path = p_route_path
      and http_method = coalesce(p_http_method, http_method)
      and action_key = p_action_key
      and status = 'active'
    limit 1;

    if v_wiring.id is null then
      perform public.ac360_create_policy_event(p_org_id, p_actor_app_user_id, 'policy.route_wiring.warning', p_action_key, coalesce(p_feature_key, v_action.feature_key), coalesce(p_meter_key, v_action.meter_key), p_route_path, p_http_method, 'warning', 'open', 'Route/action wiring is missing or inactive for this execution path.', null, null, coalesce(p_metadata,'{}'::jsonb));
    end if;
  end if;

  select * into v_override
  from public.ac360_policy_override_requests
  where org_id = p_org_id
    and status = 'approved'
    and (expires_at is null or expires_at > now())
    and (action_key is null or action_key = p_action_key)
    and (feature_key is null or feature_key = coalesce(p_feature_key, v_action.feature_key))
  order by created_at desc
  limit 1;

  if v_override.id is not null then
    perform public.ac360_record_audit(p_org_id, 'AC360-ENG-27', 'policy.override.applied', p_action_key, 'policy_override_request', v_override.id, 'success', 'notice', p_actor_app_user_id, null, jsonb_build_object('route_path',p_route_path,'quantity',p_quantity));
    return jsonb_build_object('ok',true,'allowed',true,'decision','override_allowed','reason','Approved AC360 policy override is active for this action.','guard_stage','policy_override','overrideRequestId',v_override.id,'failsafe','override');
  end if;

  select * into v_restriction
  from public.ac360_restrictions r
  where r.org_id = p_org_id
    and r.status = 'active'
    and r.behavior in ('block','suspend','read_only')
    and (
      r.target_action_key = p_action_key
      or r.target_feature_key = coalesce(p_feature_key, v_action.feature_key)
      or r.target_meter_key = coalesce(p_meter_key, v_action.meter_key)
      or r.restriction_type in ('account','subscription','billing')
    )
  order by case r.severity when 'critical' then 1 when 'high' then 2 when 'medium' then 3 else 4 end, r.created_at desc
  limit 1;

  if v_restriction.id is not null then
    v_reason := coalesce(v_restriction.reason, 'Active AC360 restriction blocks this action.');
    v_event := public.ac360_create_policy_event(p_org_id, p_actor_app_user_id, 'policy.restriction.blocked', p_action_key, coalesce(p_feature_key, v_action.feature_key), coalesce(p_meter_key, v_action.meter_key), p_route_path, p_http_method, 'critical', 'open', v_reason, null, null, jsonb_build_object('restriction_id',v_restriction.id,'restriction_key',v_restriction.restriction_key) || coalesce(p_metadata,'{}'::jsonb));
    return jsonb_build_object('ok',false,'allowed',false,'decision','billing_restricted','reason',v_reason,'guard_stage','policy_restriction','restrictionId',v_restriction.id,'failsafe','fail_closed','event',v_event);
  end if;

  select * into v_lock
  from public.ac360_policy_locks l
  where l.status = 'active'
    and (
      (l.target_action_key is not null and l.target_action_key = p_action_key)
      or (l.target_feature_key is not null and l.target_feature_key = coalesce(p_feature_key, v_action.feature_key))
      or (l.target_meter_key is not null and l.target_meter_key = coalesce(p_meter_key, v_action.meter_key))
    )
  order by case l.severity when 'critical' then 1 when 'warning' then 2 else 3 end, l.sort_order asc
  limit 1;

  if v_lock.id is not null and v_lock.behavior in ('block','suspend','read_only','require_override') then
    v_reason := coalesce(v_lock.title, 'AC360 policy lock requires review before execution.');
    v_event := public.ac360_create_policy_event(p_org_id, p_actor_app_user_id, 'policy.lock.blocked', p_action_key, coalesce(p_feature_key, v_action.feature_key), coalesce(p_meter_key, v_action.meter_key), p_route_path, p_http_method, case when v_lock.severity='critical' then 'critical' else 'warning' end, 'open', v_reason, null, null, jsonb_build_object('lock_key',v_lock.lock_key,'override_allowed',v_lock.override_allowed,'failsafe_mode',v_lock.failsafe_mode) || coalesce(p_metadata,'{}'::jsonb));
    return jsonb_build_object('ok',false,'allowed',false,'decision','policy_locked','reason',v_reason,'guard_stage','policy_lock','policyLockKey',v_lock.lock_key,'overrideAllowed',v_lock.override_allowed,'failsafe',v_lock.failsafe_mode,'event',v_event);
  end if;

  return jsonb_build_object('ok',true,'allowed',true,'decision','policy_clear','reason','Phase 1E policy safety check passed. Continue to subscription, entitlement, usage, credits and audit guard.','guard_stage','policy_clear','failsafe','checked');
end;
$$;

create or replace function public.ac360_request_policy_override(
  p_org_id uuid,
  p_action_key text,
  p_reason text,
  p_actor_app_user_id uuid default null,
  p_feature_key text default null,
  p_meter_key text default null,
  p_route_path text default null,
  p_quantity numeric default 1,
  p_requested_behavior text default 'single_action_override',
  p_expires_at timestamptz default null,
  p_guard_decision_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_status text := 'requested';
  v_expires timestamptz := coalesce(p_expires_at, now() + interval '24 hours');
begin
  if p_org_id is null then
    return jsonb_build_object('ok',false,'error','org_id is required.');
  end if;
  if coalesce(nullif(p_reason,''),'') = '' then
    return jsonb_build_object('ok',false,'error','Override reason is required.');
  end if;

  insert into public.ac360_policy_override_requests(org_id, actor_app_user_id, action_key, feature_key, meter_key, route_path, quantity, requested_behavior, reason, status, expires_at, guard_decision_id, metadata_json)
  values (p_org_id, p_actor_app_user_id, nullif(p_action_key,''), nullif(p_feature_key,''), nullif(p_meter_key,''), nullif(p_route_path,''), coalesce(p_quantity,1), coalesce(nullif(p_requested_behavior,''),'single_action_override'), p_reason, v_status, v_expires, p_guard_decision_id, coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;

  perform public.ac360_create_policy_event(p_org_id, p_actor_app_user_id, 'policy.override.requested', p_action_key, p_feature_key, p_meter_key, p_route_path, null, 'warning', 'open', 'Policy override requested: ' || p_reason, p_guard_decision_id, v_id, coalesce(p_metadata,'{}'::jsonb));
  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-27', 'policy.override.requested', p_action_key, 'policy_override_request', v_id, 'success', 'warning', p_actor_app_user_id, null, jsonb_build_object('expires_at',v_expires,'route_path',p_route_path));

  return jsonb_build_object('ok',true,'override_request_id',v_id,'status',v_status,'expires_at',v_expires);
end;
$$;

create or replace function public.ac360_decide_policy_override(
  p_request_id uuid,
  p_decision text,
  p_decision_reason text,
  p_decided_by_app_user_id uuid default null,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row public.ac360_policy_override_requests%rowtype;
  v_status text;
begin
  if p_decision not in ('approved','denied','cancelled') then
    return jsonb_build_object('ok',false,'error','Decision must be approved, denied, or cancelled.');
  end if;
  select * into v_row from public.ac360_policy_override_requests where id = p_request_id limit 1;
  if v_row.id is null then
    return jsonb_build_object('ok',false,'error','Override request not found.');
  end if;
  v_status := p_decision;
  update public.ac360_policy_override_requests
     set status = v_status,
         decided_by_app_user_id = p_decided_by_app_user_id,
         decided_at = now(),
         decision_reason = p_decision_reason,
         expires_at = case when v_status='approved' then coalesce(p_expires_at, expires_at, now() + interval '2 hours') else expires_at end,
         updated_at = now()
   where id = p_request_id
   returning * into v_row;

  perform public.ac360_create_policy_event(v_row.org_id, p_decided_by_app_user_id, 'policy.override.' || v_status, v_row.action_key, v_row.feature_key, v_row.meter_key, v_row.route_path, null, case when v_status='approved' then 'warning' else 'info' end, 'open', 'Policy override ' || v_status || ': ' || coalesce(p_decision_reason,''), v_row.guard_decision_id, v_row.id, jsonb_build_object('decision',v_status));
  perform public.ac360_record_audit(v_row.org_id, 'AC360-ENG-27', 'policy.override.' || v_status, v_row.action_key, 'policy_override_request', v_row.id, 'success', case when v_status='approved' then 'warning' else 'notice' end, p_decided_by_app_user_id, null, jsonb_build_object('decision_reason',p_decision_reason,'expires_at',v_row.expires_at));

  return jsonb_build_object('ok',true,'override_request_id',v_row.id,'status',v_row.status,'expires_at',v_row.expires_at);
end;
$$;

create or replace function public.ac360_reconcile_policy_safety(p_org_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_blocked_count int := 0;
  v_missing_count int := 0;
  v_restriction_count int := 0;
  v_event_count int := 0;
begin
  update public.ac360_policy_override_requests
     set status='expired', updated_at=now()
   where org_id = p_org_id and status in ('requested','approved') and expires_at is not null and expires_at <= now();

  select count(*) into v_blocked_count
  from public.ac360_guard_decisions
  where org_id = p_org_id and allowed = false and created_at >= now() - interval '7 days';

  select count(*) into v_restriction_count
  from public.ac360_restrictions
  where org_id = p_org_id and status='active';

  select count(*) into v_missing_count
  from public.ac360_route_coverage_audits
  where coverage_status in ('missing','expected') and enforcement_mode = 'strict';

  if v_blocked_count >= 3 then
    perform public.ac360_create_policy_event(p_org_id, null, 'policy.blocked_volume.warning', null, null, null, null, null, 'warning', 'open', 'Multiple blocked AC360 actions detected in the last 7 days. Review billing restrictions, credits, entitlements and add-ons.', null, null, jsonb_build_object('blocked_count',v_blocked_count));
    v_event_count := v_event_count + 1;
  end if;

  if v_restriction_count > 0 then
    perform public.ac360_create_policy_event(p_org_id, null, 'policy.active_restrictions.notice', null, null, null, null, null, 'warning', 'open', 'Active AC360 restrictions exist and must be resolved or intentionally maintained.', null, null, jsonb_build_object('restriction_count',v_restriction_count));
    v_event_count := v_event_count + 1;
  end if;

  perform public.ac360_record_audit(p_org_id, 'AC360-ENG-41', 'policy.safety.reconciled', 'policy.safety_reconcile', 'policy_safety', p_org_id, 'success', 'notice', null, null, jsonb_build_object('blocked_count',v_blocked_count,'restriction_count',v_restriction_count,'missing_coverage_count',v_missing_count,'event_count',v_event_count));

  return jsonb_build_object('ok',true,'blocked_count',v_blocked_count,'restriction_count',v_restriction_count,'missing_coverage_count',v_missing_count,'event_count',v_event_count);
end;
$$;

create or replace view public.ac360_policy_safety_dashboard as
select
  o.id as org_id,
  o.display_name as organization_name,
  coalesce((select count(*) from public.ac360_policy_events pe where pe.org_id=o.id and pe.status='open'),0) as open_policy_events,
  coalesce((select count(*) from public.ac360_policy_override_requests pr where pr.org_id=o.id and pr.status='requested'),0) as pending_overrides,
  coalesce((select count(*) from public.ac360_guard_decisions gd where gd.org_id=o.id and gd.allowed=false and gd.created_at >= now() - interval '7 days'),0) as blocked_last_7_days,
  coalesce((select count(*) from public.ac360_restrictions r where r.org_id=o.id and r.status='active'),0) as active_restrictions,
  coalesce((select count(*) from public.ac360_route_coverage_audits rc where rc.coverage_status in ('expected','missing') and rc.enforcement_mode='strict'),0) as strict_routes_to_review
from public.ac360_organizations o;

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase1e.policy.fail_closed','Phase 1E fail-closed safety lock','policy_enforcement','policy.preflight','{"if":"action missing / org missing / strict restriction"}'::jsonb,'{"then":"block, record policy event, expose blocked-action UX"}'::jsonb,10,'active','phase_1e'),
('phase1e.policy.override_control','Phase 1E override governance','policy_enforcement','policy.override.requested','{"if":"blocked action requires authorized exception"}'::jsonb,'{"then":"create request, require admin decision, expire automatically"}'::jsonb,20,'active','phase_1e'),
('phase1e.policy.route_coverage','Phase 1E route coverage review','policy_enforcement','route_coverage.scan','{"if":"serious route lacks strict wiring"}'::jsonb,'{"then":"mark coverage expected/missing and require wiring before Phase 2"}'::jsonb,30,'active','phase_1e'),
('phase1e.policy.audit_visibility','Phase 1E audit visibility','policy_enforcement','guard.blocked OR policy.locked','{"if":"action blocked or overridden"}'::jsonb,'{"then":"write policy event + audit log + dashboard signal"}'::jsonb,40,'active','phase_1e')
on conflict (rule_key) do update set
  label=excluded.label,
  trigger_event=excluded.trigger_event,
  condition_json=excluded.condition_json,
  action_json=excluded.action_json,
  status=excluded.status,
  phase=excluded.phase;

insert into public.ac360_permissions(permission_key, category, label, description, risk_level, is_system_locked) values
('ac360.policy.view','ac360_policy','View AC360 policy safety center','Can view policy locks, blocked action events and route coverage.','high',true),
('ac360.policy.override','ac360_policy','Approve AC360 policy override','Can approve or deny temporary overrides for blocked actions.','critical',true),
('ac360.policy.reconcile','ac360_policy','Reconcile AC360 policy safety','Can run Phase 1E safety reconciliation.','critical',true)
on conflict (permission_key) do update set
  label=excluded.label,
  description=excluded.description,
  risk_level=excluded.risk_level,
  is_system_locked=excluded.is_system_locked;

update public.ac360_foundation_engines
   set implementation_status='phase1e_policy_locked',
       metadata_json = metadata_json || jsonb_build_object('phase1e_policy_enforcement', true, 'updated_at', now()),
       updated_at=now()
 where engine_code in ('AC360-ENG-10','AC360-ENG-26','AC360-ENG-27','AC360-ENG-41','AC360-ENG-42','AC360-ENG-43','AC360-ENG-44');

commit;
