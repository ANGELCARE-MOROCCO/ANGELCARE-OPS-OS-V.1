-- AngelCare 360 Phase 1D - Real App Action Wiring
-- Ref: AC360-PH1D-REAL-ACTION-WIRING-2026-06-30
-- Scope: strict wiring layer between existing app actions/routes and AC360 guard doctrine.
-- Safe to run multiple times on Supabase Postgres.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Real app action wiring registry.
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_app_action_wiring (
  id uuid primary key default gen_random_uuid(),
  wiring_key text not null unique,
  route_path text not null,
  http_method text not null default 'POST',
  action_key text not null references public.ac360_action_registry(action_key) on delete cascade,
  feature_key text,
  engine_code text references public.ac360_foundation_engines(engine_code) on delete set null,
  target_module text not null default 'angelcare_360',
  target_table text,
  enforcement_mode text not null default 'strict',
  quantity_strategy text not null default 'fixed_1',
  idempotency_strategy text not null default 'request_or_generated',
  current_capacity_strategy text,
  status text not null default 'active',
  description text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (http_method in ('GET','POST','PATCH','PUT','DELETE')),
  check (enforcement_mode in ('strict','advisory','shadow','disabled')),
  check (status in ('active','planned','disabled','archived'))
);

create index if not exists idx_ac360_app_action_wiring_route on public.ac360_app_action_wiring(route_path, http_method, status);
create index if not exists idx_ac360_app_action_wiring_action on public.ac360_app_action_wiring(action_key, enforcement_mode, status);
create index if not exists idx_ac360_app_action_wiring_module on public.ac360_app_action_wiring(target_module, status);

alter table public.ac360_app_action_wiring enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ac360_app_action_wiring' and policyname='ac360_app_action_wiring_service_role_all'
  ) then
    create policy ac360_app_action_wiring_service_role_all on public.ac360_app_action_wiring
      for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

drop trigger if exists trg_ac360_app_action_wiring_updated_at on public.ac360_app_action_wiring;
create trigger trg_ac360_app_action_wiring_updated_at
before update on public.ac360_app_action_wiring
for each row execute function public.ac360_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Extra real-action registry rows for actual app endpoints that are now guarded.
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('communication.email_send','communication_basic','AC360-ENG-33','Send email message','Send one email message from Email OS or school communication center.','communication.email.send','email_message',1,'require_topup','{"access_type":"write","phase":"phase_1d_real_action_wiring"}'::jsonb),
('document.attachment_register','documents_storage','AC360-ENG-50','Register/upload attachment','Register or upload one document/attachment and meter storage governance.','documents.attachment.register','storage_gb',0,'require_upgrade','{"access_type":"write","capacity_key":"storage_gb","suggested_addon_key":"storage_25gb","phase":"phase_1d_real_action_wiring"}'::jsonb),
('operations.task_create','tasks_basic','AC360-ENG-52','Create operations task','Create one internal task through existing task systems.','tasks.create',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"workflow_builder","phase":"phase_1d_real_action_wiring"}'::jsonb),
('operations.task_update','tasks_basic','AC360-ENG-52','Update operations task','Update one internal task through existing task systems.','tasks.update',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"workflow_builder","phase":"phase_1d_real_action_wiring"}'::jsonb),
('operations.task_import','tasks_department','AC360-ENG-52','Import operations tasks','Bulk import tasks into a department workspace.','tasks.import',null,0,'require_upgrade','{"access_type":"write","suggested_addon_key":"workflow_builder","phase":"phase_1d_real_action_wiring"}'::jsonb),
('capacity.measure','billing_center','AC360-ENG-25','Measure capacity snapshot','Measure and write student/staff/campus/storage capacity snapshots.','capacity.measure',null,0,'block','{"access_type":"write","phase":"phase_1d_real_action_wiring"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 3. Route-to-action wiring seeds. These rows document the exact real app routes
--    that must run through AC360 before the actual executor is called.
-- -----------------------------------------------------------------------------
insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table,
  enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, status, description, metadata_json
) values
('ac360.addon.activate','/api/ac360/addons','POST','addon.activate','billing_center','AC360-ENG-29','angelcare_360','ac360_subscription_items','strict','fixed_1','request_or_generated',null,'active','Activates Growth Menu add-on only after billing/action guard passes.','{"phase":"phase_1d","critical":true}'::jsonb),
('ac360.addon.cancel','/api/ac360/addons','DELETE','addon.cancel','billing_center','AC360-ENG-30','angelcare_360','ac360_subscription_items','strict','fixed_1','request_or_generated',null,'active','Cancels Growth Menu add-on while preserving historical data.','{"phase":"phase_1d","data_preservation":"read_only_after_period"}'::jsonb),
('ac360.credits.topup','/api/ac360/credits/topup','POST','credits.topup','credit_wallet','AC360-ENG-36','angelcare_360','ac360_credit_ledger','strict','amount_as_metadata','request_or_generated',null,'active','Adds AngelCare Credits through guarded credit wallet action.','{"phase":"phase_1d","critical":true}'::jsonb),
('ac360.invoice.generate','/api/ac360/invoices/generate','POST','invoice.generate','finance_basic','AC360-ENG-17','angelcare_360','ac360_invoices','strict','fixed_1','request_or_generated',null,'active','Generates subscription invoice/PDF billing output after credit and entitlement check.','{"phase":"phase_1d","metered":true}'::jsonb),
('ac360.lifecycle.reconcile','/api/ac360/lifecycle/reconcile','POST','lifecycle.reconcile','billing_center','AC360-ENG-41','angelcare_360','ac360_restrictions','strict','fixed_1','request_or_generated',null,'active','Runs trial, grace, overdue and restriction reconciliation through AC360 guard.','{"phase":"phase_1d","critical":true}'::jsonb),
('ac360.capacity.snapshot','/api/ac360/capacity/snapshot','POST','capacity.measure','billing_center','AC360-ENG-25','angelcare_360','ac360_capacity_snapshots','strict','fixed_1','request_or_generated',null,'active','Writes live capacity snapshots through Phase 1 guard chain.','{"phase":"phase_1d"}'::jsonb),
('email_os.compose_send','/api/email-os/compose/send','POST','communication.email_send','communication_basic','AC360-ENG-33','email_os','email_os_core_outbox','strict','recipient_count','request_or_generated',null,'active','Sends operational email only after entitlement and AngelCare Credits check.','{"phase":"phase_1d","meter":"email_message"}'::jsonb),
('email_os.ai_assist','/api/email-os/ai-assist','POST','ai.message_generate','ai_assistant','AC360-ENG-33','email_os',null,'strict','fixed_1','request_or_generated',null,'active','AI-assisted draft generation is guarded and metered with AI credits.','{"phase":"phase_1d","meter":"ai_credit"}'::jsonb),
('email_os.compose_attachments','/api/email-os/compose/attachments','POST','document.attachment_register','documents_storage','AC360-ENG-50','email_os','email_os_core_compose_attachments','strict','attachment_storage','request_or_generated','storage_gb_snapshot','active','Attachment registration is guarded through document/storage entitlement.','{"phase":"phase_1d","capacity_key":"storage_gb"}'::jsonb),
('capital.tasks.create','/api/capital-command-center/tasks','POST','operations.task_create','tasks_basic','AC360-ENG-52','capital_command_center','capital_tasks','strict','fixed_or_starter_count','request_or_generated',null,'active','Task creation runs through AC360 task/operations guard before write.','{"phase":"phase_1d"}'::jsonb),
('capital.tasks.import','/api/capital-command-center/tasks/import','POST','operations.task_import','tasks_department','AC360-ENG-52','capital_command_center','capital_tasks','strict','row_count','request_or_generated',null,'active','Bulk CSV task import runs through AC360 task workspace entitlement.','{"phase":"phase_1d","bulk":true}'::jsonb),
('revenue.tasks.update','/api/tasks','PATCH','operations.task_update','tasks_basic','AC360-ENG-52','revenue_tasks','revenue_tasks','strict','fixed_1','request_or_generated',null,'active','Revenue task edits are guarded as task operations actions.','{"phase":"phase_1d"}'::jsonb)
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
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. Phase 1D automation rules.
-- -----------------------------------------------------------------------------
insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase1d.wiring.strict_before_executor','Strict route wiring must run before executor','Entitlement & Feature Control System','app.route.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_guard":true,"block_before_executor":true}'::jsonb,90,'active','phase_1d_real_action_wiring'),
('phase1d.wiring.executor_success_usage','Successful executor records usage after success','Usage, Credits & Metering System','app.route.executor_success','{"guard_allowed":true}'::jsonb,'{"record_usage_after_success":true,"deduct_credits":true}'::jsonb,91,'active','phase_1d_real_action_wiring'),
('phase1d.wiring.blocked_response','Blocked route returns billing/upgrade/top-up decision','Account Lifecycle & Restriction System','app.route.guard_blocked','{"allowed":false}'::jsonb,'{"return_status":402,"include_guard_decision":true,"preserve_data":true}'::jsonb,92,'active','phase_1d_real_action_wiring')
on conflict (rule_key) do update set label=excluded.label, condition_json=excluded.condition_json, action_json=excluded.action_json, sort_order=excluded.sort_order, status=excluded.status, phase=excluded.phase, updated_at=now();

-- -----------------------------------------------------------------------------
-- 5. Permissions.
-- -----------------------------------------------------------------------------
insert into public.ac360_permissions(permission_key, category, label, description, risk_level, is_system_locked) values
('ac360.action_wiring.view','AC360 Guard','View real action wiring','Allows viewing the real app route/action wiring matrix.', 'medium', true),
('ac360.action_wiring.manage','AC360 Guard','Manage real action wiring','Allows managing route/action wiring enforcement.', 'critical', true)
on conflict (permission_key) do update set label=excluded.label, description=excluded.description, risk_level=excluded.risk_level, updated_at=now();
