-- AngelCare 360 Phase 2R - Internal AngelCare Admin, Portfolio, Support, Deployment & Nationwide Success Runtime
-- Ref: AC360-PH2R-INTERNAL-ADMIN-NATIONWIDE-SUCCESS-2026-06-30
-- Scope: backend/system-only internal admin, client portfolio, support, deployment, city expansion and national success runtime.
-- Strict rule: no internal-admin/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2Q runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Internal AngelCare admin / portfolio / support / deployment tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_internal_portfolio_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  managed_org_id uuid references public.ac360_organizations(id) on delete set null,
  portfolio_key text not null,
  client_name text not null,
  city text,
  segment text not null default 'standard_school',
  lifecycle_stage text not null default 'prospect',
  success_tier text not null default 'standard',
  health_status text not null default 'unknown',
  risk_level text not null default 'normal',
  assigned_owner uuid,
  assigned_success_manager uuid,
  active_plan_key text,
  active_modules text[] not null default '{}',
  last_touchpoint_at timestamptz,
  next_review_date date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, portfolio_key),
  check (lifecycle_stage in ('prospect','onboarding','active','expanding','at_risk','paused','churned','archived')),
  check (success_tier in ('standard','priority','serenite','enterprise')),
  check (health_status in ('unknown','healthy','watch','risk','critical')),
  check (risk_level in ('low','normal','high','critical'))
);

create table if not exists public.ac360_internal_support_queues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  queue_key text not null,
  label text not null,
  queue_type text not null default 'support',
  sla_minutes integer not null default 1440,
  escalation_minutes integer not null default 2880,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, queue_key),
  check (queue_type in ('support','billing','technical','onboarding','success','deployment','sales','custom')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_internal_support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  portfolio_account_id uuid references public.ac360_internal_portfolio_accounts(id) on delete set null,
  managed_org_id uuid references public.ac360_organizations(id) on delete set null,
  queue_id uuid references public.ac360_internal_support_queues(id) on delete set null,
  ticket_key text not null,
  subject text not null,
  description text,
  channel text not null default 'internal',
  priority text not null default 'normal',
  severity text not null default 'medium',
  status text not null default 'open',
  assigned_to uuid,
  opened_by uuid,
  due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  resolution_summary text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, ticket_key),
  check (channel in ('internal','email','whatsapp','phone','client_portal','system','other')),
  check (priority in ('low','normal','high','urgent')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','triaged','in_progress','waiting_client','waiting_internal','escalated','resolved','closed','archived'))
);

create table if not exists public.ac360_internal_support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  support_ticket_id uuid not null references public.ac360_internal_support_tickets(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_internal_deployment_releases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  release_key text not null,
  label text not null,
  release_type text not null default 'runtime_patch',
  target_environment text not null default 'production',
  status text not null default 'planned',
  risk_level text not null default 'normal',
  planned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  rollback_required boolean not null default false,
  release_notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, release_key),
  check (release_type in ('runtime_patch','database_migration','feature_release','hotfix','security_patch','configuration','custom')),
  check (target_environment in ('development','preview','staging','production')),
  check (status in ('planned','in_progress','blocked','ready','deployed','rolled_back','failed','cancelled','archived')),
  check (risk_level in ('low','normal','high','critical'))
);

create table if not exists public.ac360_internal_deployment_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  deployment_release_id uuid references public.ac360_internal_deployment_releases(id) on delete cascade,
  check_key text not null,
  label text not null,
  check_group text not null default 'deployment',
  status text not null default 'pending',
  required boolean not null default true,
  result_json jsonb not null default '{}'::jsonb,
  checked_at timestamptz,
  checked_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, deployment_release_id, check_key),
  check (status in ('pending','passed','failed','warning','skipped','blocked'))
);

create table if not exists public.ac360_internal_deployment_incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  deployment_release_id uuid references public.ac360_internal_deployment_releases(id) on delete set null,
  incident_key text not null,
  title text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  impact_scope text not null default 'single_client',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_summary text,
  assigned_to uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, incident_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','investigating','mitigating','resolved','closed','archived')),
  check (impact_scope in ('single_client','multi_client','city','national','internal_only'))
);

create table if not exists public.ac360_internal_city_markets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  city_key text not null,
  city_name text not null,
  region_name text,
  market_status text not null default 'planned',
  target_schools integer not null default 0,
  active_clients integer not null default 0,
  pipeline_clients integer not null default 0,
  success_health text not null default 'unknown',
  assigned_lead uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, city_key),
  check (market_status in ('planned','research','pilot','active','scaling','paused','archived')),
  check (success_health in ('unknown','healthy','watch','risk','critical'))
);

create table if not exists public.ac360_internal_expansion_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  city_market_id uuid references public.ac360_internal_city_markets(id) on delete set null,
  campaign_key text not null,
  label text not null,
  campaign_type text not null default 'city_launch',
  status text not null default 'planned',
  target_accounts integer not null default 0,
  contacted_accounts integer not null default 0,
  onboarded_accounts integer not null default 0,
  starts_on date,
  ends_on date,
  assigned_owner uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, campaign_key),
  check (campaign_type in ('city_launch','partner_activation','upsell','renewal','winback','support_drive','custom')),
  check (status in ('planned','active','paused','completed','cancelled','archived'))
);

create table if not exists public.ac360_internal_admin_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  portfolio_account_id uuid references public.ac360_internal_portfolio_accounts(id) on delete set null,
  task_key text not null,
  title text not null,
  task_type text not null default 'internal_admin',
  priority text not null default 'normal',
  status text not null default 'todo',
  due_at timestamptz,
  assigned_to uuid,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, task_key),
  check (priority in ('low','normal','high','urgent')),
  check (status in ('todo','in_progress','blocked','completed','cancelled','archived'))
);

create table if not exists public.ac360_internal_admin_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  active_clients integer not null default 0,
  at_risk_clients integer not null default 0,
  open_support_tickets integer not null default 0,
  critical_incidents integer not null default 0,
  active_city_markets integer not null default 0,
  active_expansion_campaigns integer not null default 0,
  pending_internal_tasks integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

create table if not exists public.ac360_internal_admin_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  severity text not null default 'warning',
  alert_type text not null default 'internal_admin',
  title text not null,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('info','warning','critical')),
  check (status in ('open','acknowledged','resolved','ignored','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Triggers
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'ac360_internal_portfolio_accounts','ac360_internal_support_queues','ac360_internal_support_tickets','ac360_internal_deployment_releases','ac360_internal_deployment_checks','ac360_internal_deployment_incidents','ac360_internal_city_markets','ac360_internal_expansion_campaigns','ac360_internal_admin_tasks','ac360_internal_admin_alerts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Feature/action/app-wiring registry
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,status,metadata_json)
values('internal_admin_portfolio','angelcare_360_internal','internal_admin','AngelCare Internal Admin Portfolio','Internal AngelCare portfolio, support, deployment, nationwide expansion and success governance.','governance',false,false,true,'automation_credit',1,'active','{"phase":"phase_2r","internalOnly":true,"uiBuildAllowed":false}'::jsonb)
on conflict(feature_key) do update set label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_enterprise_only=excluded.is_enterprise_only,metadata_json=public.ac360_feature_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json)
values
('internal.portfolio_account.upsert','internal_admin_portfolio','AC360-ENG-52','Upsert portfolio account','Create or update AngelCare internal client portfolio account.','internal.portfolio.account.upsert','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.support_queue.upsert','internal_admin_portfolio','AC360-ENG-52','Upsert support queue','Create/update internal support queue and SLA.','internal.support.queue.upsert','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.support_ticket.open','internal_admin_portfolio','AC360-ENG-52','Open support ticket','Open client/internal support ticket.','internal.support.ticket.open','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.support_ticket.status.update','internal_admin_portfolio','AC360-ENG-52','Update support ticket status','Update support ticket lifecycle state.','internal.support.ticket.status.update','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.deployment_release.create','internal_admin_portfolio','AC360-ENG-52','Create deployment release','Create internal deployment/release record.','internal.deployment.release.create','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.deployment_check.record','internal_admin_portfolio','AC360-ENG-52','Record deployment check','Record a deployment gate/check result.','internal.deployment.check.record','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.deployment_incident.open','internal_admin_portfolio','AC360-ENG-52','Open deployment incident','Open deployment/support incident.','internal.deployment.incident.open','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.deployment_incident.resolve','internal_admin_portfolio','AC360-ENG-52','Resolve deployment incident','Resolve deployment/support incident.','internal.deployment.incident.resolve','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.city_market.upsert','internal_admin_portfolio','AC360-ENG-52','Upsert city market','Create/update city market expansion record.','internal.city.market.upsert','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.expansion_campaign.create','internal_admin_portfolio','AC360-ENG-52','Create expansion campaign','Create nationwide/city expansion campaign.','internal.expansion.campaign.create','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.admin_task.create','internal_admin_portfolio','AC360-ENG-52','Create internal admin task','Create internal admin/nationwide operations task.','internal.admin.task.create','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.admin.reconcile','internal_admin_portfolio','AC360-ENG-52','Reconcile internal admin runtime','Compute national/internal admin snapshot and alerts.','internal.admin.reconcile','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb),
('internal.admin.alert.resolve','internal_admin_portfolio','AC360-ENG-52','Resolve internal admin alert','Resolve internal admin/nationwide success alert.','internal.admin.alert.resolve','automation_credit',1,'block','{"phase":"phase_2r"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,status,description,metadata_json)
values
('ac360.internal_admin.portfolio_account.upsert','/api/ac360/internal-admin/portfolio/accounts/upsert','POST','internal.portfolio_account.upsert','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_portfolio_accounts','strict','fixed_1','request_or_generated','active','Guard internal portfolio account upsert.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.support_queue.upsert','/api/ac360/internal-admin/support/queues/upsert','POST','internal.support_queue.upsert','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_support_queues','strict','fixed_1','request_or_generated','active','Guard internal support queue upsert.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.support_ticket.open','/api/ac360/internal-admin/support/tickets/open','POST','internal.support_ticket.open','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_support_tickets','strict','fixed_1','request_or_generated','active','Guard support ticket opening.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.support_ticket.status','/api/ac360/internal-admin/support/tickets/status','POST','internal.support_ticket.status.update','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_support_tickets','strict','fixed_1','request_or_generated','active','Guard support ticket status updates.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.deployment_release.create','/api/ac360/internal-admin/deployments/releases/create','POST','internal.deployment_release.create','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_deployment_releases','strict','fixed_1','request_or_generated','active','Guard deployment release creation.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.deployment_check.record','/api/ac360/internal-admin/deployments/checks/record','POST','internal.deployment_check.record','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_deployment_checks','strict','fixed_1','request_or_generated','active','Guard deployment check recording.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.deployment_incident.open','/api/ac360/internal-admin/deployments/incidents/open','POST','internal.deployment_incident.open','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_deployment_incidents','strict','fixed_1','request_or_generated','active','Guard deployment incident opening.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.deployment_incident.resolve','/api/ac360/internal-admin/deployments/incidents/resolve','POST','internal.deployment_incident.resolve','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_deployment_incidents','strict','fixed_1','request_or_generated','active','Guard deployment incident resolution.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.city_market.upsert','/api/ac360/internal-admin/nationwide/city-markets/upsert','POST','internal.city_market.upsert','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_city_markets','strict','fixed_1','request_or_generated','active','Guard city market upsert.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.expansion_campaign.create','/api/ac360/internal-admin/nationwide/expansion-campaigns/create','POST','internal.expansion_campaign.create','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_expansion_campaigns','strict','fixed_1','request_or_generated','active','Guard expansion campaign creation.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.task.create','/api/ac360/internal-admin/tasks/create','POST','internal.admin_task.create','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_admin_tasks','strict','fixed_1','request_or_generated','active','Guard internal admin task creation.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.reconcile','/api/ac360/internal-admin/reconcile','POST','internal.admin.reconcile','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_admin_snapshots','strict','fixed_1','request_or_generated','active','Guard internal admin reconciliation.','{"phase":"phase_2r"}'::jsonb),
('ac360.internal_admin.alert.resolve','/api/ac360/internal-admin/alerts/resolve','POST','internal.admin.alert.resolve','internal_admin_portfolio','AC360-ENG-52','angelcare_360_internal_admin','ac360_internal_admin_alerts','strict','fixed_1','request_or_generated','active','Guard internal admin alert resolution.','{"phase":"phase_2r"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values('internal_admin_portfolio_support_deployment','AC360-ENG-52','internal_admin_portfolio','Internal AngelCare Admin, Portfolio, Support, Deployment & Nationwide Success Runtime','phase_2r_internal_admin_nationwide_success','guarded',array['ac360_internal_portfolio_accounts','ac360_internal_support_tickets','ac360_internal_deployment_releases','ac360_internal_city_markets','ac360_internal_admin_alerts'],array['internal.portfolio_account.upsert','internal.support_ticket.open','internal.deployment_release.create','internal.city_market.upsert','internal.admin.reconcile'],'{"phase":"phase_2r","uiBuildAllowed":false,"internalOnly":true}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json||excluded.metadata_json,updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. Runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_internal_admin_dashboard(p_org_id uuid, p_as_of_date date default current_date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'ok', true,
    'phase', 'phase_2r_internal_admin_nationwide_success',
    'asOfDate', coalesce(p_as_of_date, current_date),
    'portfolioAccounts', (select count(*) from public.ac360_internal_portfolio_accounts where org_id=p_org_id and lifecycle_stage <> 'archived'),
    'activeClients', (select count(*) from public.ac360_internal_portfolio_accounts where org_id=p_org_id and lifecycle_stage in ('active','expanding')),
    'atRiskClients', (select count(*) from public.ac360_internal_portfolio_accounts where org_id=p_org_id and (risk_level in ('high','critical') or health_status in ('risk','critical'))),
    'openSupportTickets', (select count(*) from public.ac360_internal_support_tickets where org_id=p_org_id and status not in ('resolved','closed','archived')),
    'criticalIncidents', (select count(*) from public.ac360_internal_deployment_incidents where org_id=p_org_id and severity='critical' and status not in ('resolved','closed','archived')),
    'activeCityMarkets', (select count(*) from public.ac360_internal_city_markets where org_id=p_org_id and market_status in ('pilot','active','scaling')),
    'activeExpansionCampaigns', (select count(*) from public.ac360_internal_expansion_campaigns where org_id=p_org_id and status='active'),
    'pendingInternalTasks', (select count(*) from public.ac360_internal_admin_tasks where org_id=p_org_id and status not in ('completed','cancelled','archived')),
    'openAlerts', (select count(*) from public.ac360_internal_admin_alerts where org_id=p_org_id and status='open'),
    'uiBuildAllowed', false
  ) into result;
  return result;
end $$;

create or replace function public.ac360_internal_upsert_portfolio_account(p_org_id uuid,p_portfolio_id uuid default null,p_managed_org_id uuid default null,p_portfolio_key text default null,p_client_name text default null,p_city text default null,p_segment text default 'standard_school',p_lifecycle_stage text default 'active',p_success_tier text default 'standard',p_health_status text default 'unknown',p_risk_level text default 'normal',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_portfolio_key,''),'portfolio-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_internal_portfolio_accounts(id,org_id,managed_org_id,portfolio_key,client_name,city,segment,lifecycle_stage,success_tier,health_status,risk_level,created_by,metadata_json)
  values(coalesce(p_portfolio_id,gen_random_uuid()),p_org_id,p_managed_org_id,keyv,coalesce(nullif(p_client_name,''),'Unnamed Client'),p_city,coalesce(nullif(p_segment,''),'standard_school'),coalesce(nullif(p_lifecycle_stage,''),'active'),coalesce(nullif(p_success_tier,''),'standard'),coalesce(nullif(p_health_status,''),'unknown'),coalesce(nullif(p_risk_level,''),'normal'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,portfolio_key) do update set managed_org_id=excluded.managed_org_id,client_name=excluded.client_name,city=excluded.city,segment=excluded.segment,lifecycle_stage=excluded.lifecycle_stage,success_tier=excluded.success_tier,health_status=excluded.health_status,risk_level=excluded.risk_level,metadata_json=public.ac360_internal_portfolio_accounts.metadata_json||excluded.metadata_json,updated_at=now()
  returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'portfolioKey',keyv);
end $$;

create or replace function public.ac360_internal_upsert_support_queue(p_org_id uuid,p_queue_id uuid default null,p_queue_key text default null,p_label text default null,p_queue_type text default 'support',p_sla_minutes integer default 1440,p_escalation_minutes integer default 2880,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_queue_key,''),'queue-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_internal_support_queues(id,org_id,queue_key,label,queue_type,sla_minutes,escalation_minutes,metadata_json)
  values(coalesce(p_queue_id,gen_random_uuid()),p_org_id,keyv,coalesce(nullif(p_label,''),'Support Queue'),coalesce(nullif(p_queue_type,''),'support'),coalesce(p_sla_minutes,1440),coalesce(p_escalation_minutes,2880),coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,queue_key) do update set label=excluded.label,queue_type=excluded.queue_type,sla_minutes=excluded.sla_minutes,escalation_minutes=excluded.escalation_minutes,metadata_json=public.ac360_internal_support_queues.metadata_json||excluded.metadata_json,updated_at=now()
  returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'queueKey',keyv);
end $$;

create or replace function public.ac360_internal_open_support_ticket(p_org_id uuid,p_portfolio_account_id uuid default null,p_managed_org_id uuid default null,p_queue_id uuid default null,p_ticket_key text default null,p_subject text default null,p_description text default null,p_channel text default 'internal',p_priority text default 'normal',p_severity text default 'medium',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_ticket_key,''),'SUP-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_internal_support_tickets(org_id,portfolio_account_id,managed_org_id,queue_id,ticket_key,subject,description,channel,priority,severity,status,opened_by,metadata_json)
  values(p_org_id,p_portfolio_account_id,p_managed_org_id,p_queue_id,keyv,coalesce(nullif(p_subject,''),'Support ticket'),p_description,coalesce(nullif(p_channel,''),'internal'),coalesce(nullif(p_priority,''),'normal'),coalesce(nullif(p_severity,''),'medium'),'open',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into rid;
  insert into public.ac360_internal_support_ticket_events(org_id,support_ticket_id,event_type,to_status,message,actor_app_user_id,metadata_json) values(p_org_id,rid,'opened','open','Support ticket opened.',p_actor_app_user_id,'{}'::jsonb);
  return jsonb_build_object('ok',true,'id',rid,'ticketKey',keyv);
end $$;

create or replace function public.ac360_internal_update_support_ticket_status(p_org_id uuid,p_ticket_id uuid,p_status text,p_actor_app_user_id uuid default null,p_message text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare old_status text; rid uuid;
begin
  select status into old_status from public.ac360_internal_support_tickets where id=p_ticket_id and org_id=p_org_id for update;
  if old_status is null then return jsonb_build_object('ok',false,'error','support_ticket_not_found'); end if;
  update public.ac360_internal_support_tickets set status=coalesce(nullif(p_status,''),status), resolved_at=case when coalesce(nullif(p_status,''),status) in ('resolved','closed') then now() else resolved_at end, resolution_summary=coalesce(p_message,resolution_summary), updated_at=now() where id=p_ticket_id and org_id=p_org_id returning id into rid;
  insert into public.ac360_internal_support_ticket_events(org_id,support_ticket_id,event_type,from_status,to_status,message,actor_app_user_id,metadata_json) values(p_org_id,p_ticket_id,'status_update',old_status,p_status,p_message,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'id',rid,'fromStatus',old_status,'toStatus',p_status);
end $$;

create or replace function public.ac360_internal_create_deployment_release(p_org_id uuid,p_release_key text default null,p_label text default null,p_release_type text default 'runtime_patch',p_target_environment text default 'production',p_risk_level text default 'normal',p_release_notes text default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_release_key,''),'REL-'||to_char(now(),'YYYYMMDDHH24MISS'));
  insert into public.ac360_internal_deployment_releases(org_id,release_key,label,release_type,target_environment,status,risk_level,release_notes,created_by,metadata_json)
  values(p_org_id,keyv,coalesce(nullif(p_label,''),'Deployment Release'),coalesce(nullif(p_release_type,''),'runtime_patch'),coalesce(nullif(p_target_environment,''),'production'),'planned',coalesce(nullif(p_risk_level,''),'normal'),p_release_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,release_key) do update set label=excluded.label,release_type=excluded.release_type,target_environment=excluded.target_environment,risk_level=excluded.risk_level,release_notes=excluded.release_notes,metadata_json=public.ac360_internal_deployment_releases.metadata_json||excluded.metadata_json,updated_at=now()
  returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'releaseKey',keyv);
end $$;

create or replace function public.ac360_internal_record_deployment_check(p_org_id uuid,p_deployment_release_id uuid default null,p_check_key text default null,p_label text default null,p_check_group text default 'deployment',p_status text default 'passed',p_required boolean default true,p_result_json jsonb default '{}'::jsonb,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_check_key,''),'check-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_internal_deployment_checks(org_id,deployment_release_id,check_key,label,check_group,status,required,result_json,checked_at,checked_by,metadata_json)
  values(p_org_id,p_deployment_release_id,keyv,coalesce(nullif(p_label,''),'Deployment Check'),coalesce(nullif(p_check_group,''),'deployment'),coalesce(nullif(p_status,''),'passed'),coalesce(p_required,true),coalesce(p_result_json,'{}'::jsonb),now(),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,deployment_release_id,check_key) do update set label=excluded.label,check_group=excluded.check_group,status=excluded.status,required=excluded.required,result_json=excluded.result_json,checked_at=now(),checked_by=excluded.checked_by,metadata_json=public.ac360_internal_deployment_checks.metadata_json||excluded.metadata_json,updated_at=now()
  returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'checkKey',keyv);
end $$;

create or replace function public.ac360_internal_open_deployment_incident(p_org_id uuid,p_deployment_release_id uuid default null,p_incident_key text default null,p_title text default null,p_severity text default 'medium',p_impact_scope text default 'single_client',p_assigned_to uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_incident_key,''),'INC-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_internal_deployment_incidents(org_id,deployment_release_id,incident_key,title,severity,status,impact_scope,assigned_to,metadata_json)
  values(p_org_id,p_deployment_release_id,keyv,coalesce(nullif(p_title,''),'Deployment incident'),coalesce(nullif(p_severity,''),'medium'),'open',coalesce(nullif(p_impact_scope,''),'single_client'),p_assigned_to,coalesce(p_metadata,'{}'::jsonb)) returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'incidentKey',keyv);
end $$;

create or replace function public.ac360_internal_resolve_deployment_incident(p_org_id uuid,p_incident_id uuid,p_resolution_summary text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  update public.ac360_internal_deployment_incidents set status='resolved', resolved_at=now(), resolution_summary=coalesce(p_resolution_summary,resolution_summary), metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_incident_id and org_id=p_org_id returning id into rid;
  if rid is null then return jsonb_build_object('ok',false,'error','deployment_incident_not_found'); end if;
  return jsonb_build_object('ok',true,'id',rid,'status','resolved');
end $$;

create or replace function public.ac360_internal_upsert_city_market(p_org_id uuid,p_city_key text default null,p_city_name text default null,p_region_name text default null,p_market_status text default 'planned',p_target_schools integer default 0,p_assigned_lead uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_city_key,''),lower(regexp_replace(coalesce(p_city_name,'city'),'[^a-zA-Z0-9]+','_','g')));
  insert into public.ac360_internal_city_markets(org_id,city_key,city_name,region_name,market_status,target_schools,assigned_lead,metadata_json)
  values(p_org_id,keyv,coalesce(nullif(p_city_name,''),'City'),p_region_name,coalesce(nullif(p_market_status,''),'planned'),coalesce(p_target_schools,0),p_assigned_lead,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,city_key) do update set city_name=excluded.city_name,region_name=excluded.region_name,market_status=excluded.market_status,target_schools=excluded.target_schools,assigned_lead=excluded.assigned_lead,metadata_json=public.ac360_internal_city_markets.metadata_json||excluded.metadata_json,updated_at=now()
  returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'cityKey',keyv);
end $$;

create or replace function public.ac360_internal_create_expansion_campaign(p_org_id uuid,p_city_market_id uuid default null,p_campaign_key text default null,p_label text default null,p_campaign_type text default 'city_launch',p_target_accounts integer default 0,p_starts_on date default null,p_ends_on date default null,p_assigned_owner uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_campaign_key,''),'EXP-'||to_char(now(),'YYYYMMDDHH24MISS'));
  insert into public.ac360_internal_expansion_campaigns(org_id,city_market_id,campaign_key,label,campaign_type,status,target_accounts,starts_on,ends_on,assigned_owner,metadata_json)
  values(p_org_id,p_city_market_id,keyv,coalesce(nullif(p_label,''),'Expansion Campaign'),coalesce(nullif(p_campaign_type,''),'city_launch'),'planned',coalesce(p_target_accounts,0),p_starts_on,p_ends_on,p_assigned_owner,coalesce(p_metadata,'{}'::jsonb)) returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'campaignKey',keyv);
end $$;

create or replace function public.ac360_internal_create_admin_task(p_org_id uuid,p_portfolio_account_id uuid default null,p_task_key text default null,p_title text default null,p_task_type text default 'internal_admin',p_priority text default 'normal',p_due_at timestamptz default null,p_assigned_to uuid default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; keyv text;
begin
  keyv := coalesce(nullif(p_task_key,''),'TASK-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_internal_admin_tasks(org_id,portfolio_account_id,task_key,title,task_type,priority,status,due_at,assigned_to,created_by,metadata_json)
  values(p_org_id,p_portfolio_account_id,keyv,coalesce(nullif(p_title,''),'Internal admin task'),coalesce(nullif(p_task_type,''),'internal_admin'),coalesce(nullif(p_priority,''),'normal'),'todo',p_due_at,p_assigned_to,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'taskKey',keyv);
end $$;

create or replace function public.ac360_internal_admin_reconcile(p_org_id uuid,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare snap_id uuid; active_clients integer; risk_clients integer; open_tickets integer; critical_incidents integer; active_cities integer; active_campaigns integer; pending_tasks integer;
begin
  select count(*) into active_clients from public.ac360_internal_portfolio_accounts where org_id=p_org_id and lifecycle_stage in ('active','expanding');
  select count(*) into risk_clients from public.ac360_internal_portfolio_accounts where org_id=p_org_id and (risk_level in ('high','critical') or health_status in ('risk','critical'));
  select count(*) into open_tickets from public.ac360_internal_support_tickets where org_id=p_org_id and status not in ('resolved','closed','archived');
  select count(*) into critical_incidents from public.ac360_internal_deployment_incidents where org_id=p_org_id and severity='critical' and status not in ('resolved','closed','archived');
  select count(*) into active_cities from public.ac360_internal_city_markets where org_id=p_org_id and market_status in ('pilot','active','scaling');
  select count(*) into active_campaigns from public.ac360_internal_expansion_campaigns where org_id=p_org_id and status='active';
  select count(*) into pending_tasks from public.ac360_internal_admin_tasks where org_id=p_org_id and status not in ('completed','cancelled','archived');
  insert into public.ac360_internal_admin_snapshots(org_id,snapshot_date,active_clients,at_risk_clients,open_support_tickets,critical_incidents,active_city_markets,active_expansion_campaigns,pending_internal_tasks,metadata_json)
  values(p_org_id,current_date,active_clients,risk_clients,open_tickets,critical_incidents,active_cities,active_campaigns,pending_tasks,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,snapshot_date) do update set active_clients=excluded.active_clients,at_risk_clients=excluded.at_risk_clients,open_support_tickets=excluded.open_support_tickets,critical_incidents=excluded.critical_incidents,active_city_markets=excluded.active_city_markets,active_expansion_campaigns=excluded.active_expansion_campaigns,pending_internal_tasks=excluded.pending_internal_tasks,metadata_json=public.ac360_internal_admin_snapshots.metadata_json||excluded.metadata_json
  returning id into snap_id;
  if critical_incidents > 0 then
    insert into public.ac360_internal_admin_alerts(org_id,alert_key,severity,alert_type,title,message,metadata_json)
    values(p_org_id,'critical-deployment-incidents-'||current_date,'critical','deployment','Critical deployment incidents open','One or more critical deployment incidents are open.','{}'::jsonb)
    on conflict(org_id,alert_key) do update set status='open',updated_at=now();
  end if;
  if risk_clients > 0 then
    insert into public.ac360_internal_admin_alerts(org_id,alert_key,severity,alert_type,title,message,metadata_json)
    values(p_org_id,'at-risk-clients-'||current_date,'warning','client_success','At-risk clients detected','One or more portfolio accounts are at risk.','{}'::jsonb)
    on conflict(org_id,alert_key) do update set status='open',updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'snapshotId',snap_id,'activeClients',active_clients,'atRiskClients',risk_clients,'openSupportTickets',open_tickets,'criticalIncidents',critical_incidents,'activeCityMarkets',active_cities,'activeExpansionCampaigns',active_campaigns,'pendingInternalTasks',pending_tasks);
end $$;

create or replace function public.ac360_internal_resolve_admin_alert(p_org_id uuid,p_alert_id uuid,p_actor_app_user_id uuid default null,p_resolution_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  update public.ac360_internal_admin_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('resolutionNote',p_resolution_note)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id returning id into rid;
  if rid is null then return jsonb_build_object('ok',false,'error','internal_admin_alert_not_found'); end if;
  return jsonb_build_object('ok',true,'id',rid,'status','resolved');
end $$;

-- -----------------------------------------------------------------------------
-- 5. RLS service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_internal_portfolio_accounts enable row level security;
alter table public.ac360_internal_support_queues enable row level security;
alter table public.ac360_internal_support_tickets enable row level security;
alter table public.ac360_internal_support_ticket_events enable row level security;
alter table public.ac360_internal_deployment_releases enable row level security;
alter table public.ac360_internal_deployment_checks enable row level security;
alter table public.ac360_internal_deployment_incidents enable row level security;
alter table public.ac360_internal_city_markets enable row level security;
alter table public.ac360_internal_expansion_campaigns enable row level security;
alter table public.ac360_internal_admin_tasks enable row level security;
alter table public.ac360_internal_admin_snapshots enable row level security;
alter table public.ac360_internal_admin_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_internal_portfolio_accounts','ac360_internal_support_queues','ac360_internal_support_tickets','ac360_internal_support_ticket_events','ac360_internal_deployment_releases','ac360_internal_deployment_checks','ac360_internal_deployment_incidents','ac360_internal_city_markets','ac360_internal_expansion_campaigns','ac360_internal_admin_tasks','ac360_internal_admin_snapshots','ac360_internal_admin_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
