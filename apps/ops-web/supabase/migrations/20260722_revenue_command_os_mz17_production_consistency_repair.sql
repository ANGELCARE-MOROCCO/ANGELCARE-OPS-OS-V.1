begin;

-- ANGELCARE Revenue Command OS — Production Consistency Repair MZ17
-- Cumulative over MZ01–MZ16. Idempotent. External actions remain governed and disabled by default.
create extension if not exists pgcrypto;

insert into public.revenue_os_permission_registry(
  permission_key,label,description,risk_class,phase_introduced,active
) values
  ('revenue_os.view', 'View', 'Permission canonique Revenue Command OS: revenue_os.view.', 'low', 17, true),
  ('revenue_os.manage', 'Manage', 'Permission canonique Revenue Command OS: revenue_os.manage.', 'controlled', 17, true),
  ('revenue_os.objectives.manage', 'Objectives · Manage', 'Permission canonique Revenue Command OS: revenue_os.objectives.manage.', 'controlled', 17, true),
  ('revenue_os.digital_twin.manage', 'Digital Twin · Manage', 'Permission canonique Revenue Command OS: revenue_os.digital_twin.manage.', 'controlled', 17, true),
  ('revenue_os.knowledge.manage', 'Knowledge · Manage', 'Permission canonique Revenue Command OS: revenue_os.knowledge.manage.', 'controlled', 17, true),
  ('revenue_os.knowledge.approve', 'Knowledge · Approve', 'Permission canonique Revenue Command OS: revenue_os.knowledge.approve.', 'restricted', 17, true),
  ('revenue_os.signals.manage', 'Signals · Manage', 'Permission canonique Revenue Command OS: revenue_os.signals.manage.', 'controlled', 17, true),
  ('revenue_os.signals.ingest', 'Signals · Ingest', 'Permission canonique Revenue Command OS: revenue_os.signals.ingest.', 'low', 17, true),
  ('revenue_os.signals.audit', 'Signals · Audit', 'Permission canonique Revenue Command OS: revenue_os.signals.audit.', 'low', 17, true),
  ('revenue_os.strategy.view', 'Strategy · View', 'Permission canonique Revenue Command OS: revenue_os.strategy.view.', 'low', 17, true),
  ('revenue_os.strategy.manage', 'Strategy · Manage', 'Permission canonique Revenue Command OS: revenue_os.strategy.manage.', 'controlled', 17, true),
  ('revenue_os.ai.view', 'Ai · View', 'Permission canonique Revenue Command OS: revenue_os.ai.view.', 'low', 17, true),
  ('revenue_os.ai.generate', 'Ai · Generate', 'Permission canonique Revenue Command OS: revenue_os.ai.generate.', 'controlled', 17, true),
  ('revenue_os.ai.manage', 'Ai · Manage', 'Permission canonique Revenue Command OS: revenue_os.ai.manage.', 'controlled', 17, true),
  ('revenue_os.council.view', 'Council · View', 'Permission canonique Revenue Command OS: revenue_os.council.view.', 'low', 17, true),
  ('revenue_os.council.run', 'Council · Run', 'Permission canonique Revenue Command OS: revenue_os.council.run.', 'controlled', 17, true),
  ('revenue_os.council.manage', 'Council · Manage', 'Permission canonique Revenue Command OS: revenue_os.council.manage.', 'controlled', 17, true),
  ('revenue_os.validation_council.view', 'Validation Council · View', 'Permission canonique Revenue Command OS: revenue_os.validation_council.view.', 'low', 17, true),
  ('revenue_os.strategy_studio.view', 'Strategy Studio · View', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.view.', 'low', 17, true),
  ('revenue_os.strategy_studio.review', 'Strategy Studio · Review', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.review.', 'low', 17, true),
  ('revenue_os.strategy_studio.approve', 'Strategy Studio · Approve', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.approve.', 'restricted', 17, true),
  ('revenue_os.strategy_studio.approve_financial', 'Strategy Studio · Approve Financial', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.approve_financial.', 'restricted', 17, true),
  ('revenue_os.strategy_studio.approve_capacity', 'Strategy Studio · Approve Capacity', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.approve_capacity.', 'restricted', 17, true),
  ('revenue_os.strategy_studio.manage_approval_class', 'Strategy Studio · Manage Approval Class', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.manage_approval_class.', 'controlled', 17, true),
  ('revenue_os.strategy_studio.export_memo', 'Strategy Studio · Export Memo', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.export_memo.', 'low', 17, true),
  ('revenue_os.strategy_studio.manage', 'Strategy Studio · Manage', 'Permission canonique Revenue Command OS: revenue_os.strategy_studio.manage.', 'controlled', 17, true),
  ('revenue_os.commands.view', 'Commands · View', 'Permission canonique Revenue Command OS: revenue_os.commands.view.', 'low', 17, true),
  ('revenue_os.commands.simulate', 'Commands · Simulate', 'Permission canonique Revenue Command OS: revenue_os.commands.simulate.', 'controlled', 17, true),
  ('revenue_os.commands.execute', 'Commands · Execute', 'Permission canonique Revenue Command OS: revenue_os.commands.execute.', 'restricted', 17, true),
  ('revenue_os.commands.approve', 'Commands · Approve', 'Permission canonique Revenue Command OS: revenue_os.commands.approve.', 'restricted', 17, true),
  ('revenue_os.commands.manage', 'Commands · Manage', 'Permission canonique Revenue Command OS: revenue_os.commands.manage.', 'controlled', 17, true),
  ('revenue_os.commands.audit', 'Commands · Audit', 'Permission canonique Revenue Command OS: revenue_os.commands.audit.', 'low', 17, true),
  ('revenue_os.commands.rollback', 'Commands · Rollback', 'Permission canonique Revenue Command OS: revenue_os.commands.rollback.', 'restricted', 17, true),
  ('revenue_os.approvals.manage', 'Approvals · Manage', 'Permission canonique Revenue Command OS: revenue_os.approvals.manage.', 'controlled', 17, true),
  ('revenue_os.mission_compiler.view', 'Mission Compiler · View', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.view.', 'controlled', 17, true),
  ('revenue_os.mission_compiler.compile', 'Mission Compiler · Compile', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.compile.', 'controlled', 17, true),
  ('revenue_os.mission_compiler.recompile', 'Mission Compiler · Recompile', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.recompile.', 'controlled', 17, true),
  ('revenue_os.mission_compiler.resolve', 'Mission Compiler · Resolve', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.resolve.', 'controlled', 17, true),
  ('revenue_os.mission_compiler.rollback', 'Mission Compiler · Rollback', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.rollback.', 'restricted', 17, true),
  ('revenue_os.mission_compiler.prepare_propagation', 'Mission Compiler · Prepare Propagation', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.prepare_propagation.', 'controlled', 17, true),
  ('revenue_os.mission_compiler.accept_risk', 'Mission Compiler · Accept Risk', 'Permission canonique Revenue Command OS: revenue_os.mission_compiler.accept_risk.', 'controlled', 17, true),
  ('revenue_os.execution.view', 'Execution · View', 'Permission canonique Revenue Command OS: revenue_os.execution.view.', 'low', 17, true),
  ('revenue_os.execution.prepare', 'Execution · Prepare', 'Permission canonique Revenue Command OS: revenue_os.execution.prepare.', 'low', 17, true),
  ('revenue_os.execution.activate', 'Execution · Activate', 'Permission canonique Revenue Command OS: revenue_os.execution.activate.', 'restricted', 17, true),
  ('revenue_os.execution.approve', 'Execution · Approve', 'Permission canonique Revenue Command OS: revenue_os.execution.approve.', 'restricted', 17, true),
  ('revenue_os.execution.operate', 'Execution · Operate', 'Permission canonique Revenue Command OS: revenue_os.execution.operate.', 'controlled', 17, true),
  ('revenue_os.execution.rollback', 'Execution · Rollback', 'Permission canonique Revenue Command OS: revenue_os.execution.rollback.', 'restricted', 17, true),
  ('revenue_os.execution.admin', 'Execution · Admin', 'Permission canonique Revenue Command OS: revenue_os.execution.admin.', 'restricted', 17, true),
  ('revenue_os.cockpit.view', 'Cockpit · View', 'Permission canonique Revenue Command OS: revenue_os.cockpit.view.', 'low', 17, true),
  ('revenue_os.cockpit.executive_view', 'Cockpit · Executive View', 'Permission canonique Revenue Command OS: revenue_os.cockpit.executive_view.', 'low', 17, true),
  ('revenue_os.cockpit.commercial_view', 'Cockpit · Commercial View', 'Permission canonique Revenue Command OS: revenue_os.cockpit.commercial_view.', 'low', 17, true),
  ('revenue_os.cockpit.operations_view', 'Cockpit · Operations View', 'Permission canonique Revenue Command OS: revenue_os.cockpit.operations_view.', 'low', 17, true),
  ('revenue_os.cockpit.finance_view', 'Cockpit · Finance View', 'Permission canonique Revenue Command OS: revenue_os.cockpit.finance_view.', 'low', 17, true),
  ('revenue_os.cockpit.export', 'Cockpit · Export', 'Permission canonique Revenue Command OS: revenue_os.cockpit.export.', 'low', 17, true),
  ('revenue_os.cockpit.intervene', 'Cockpit · Intervene', 'Permission canonique Revenue Command OS: revenue_os.cockpit.intervene.', 'controlled', 17, true),
  ('revenue_os.cockpit.assign_intervention', 'Cockpit · Assign Intervention', 'Permission canonique Revenue Command OS: revenue_os.cockpit.assign_intervention.', 'low', 17, true),
  ('revenue_os.cockpit.resolve_exception', 'Cockpit · Resolve Exception', 'Permission canonique Revenue Command OS: revenue_os.cockpit.resolve_exception.', 'low', 17, true),
  ('revenue_os.cockpit.manage_views', 'Cockpit · Manage Views', 'Permission canonique Revenue Command OS: revenue_os.cockpit.manage_views.', 'controlled', 17, true),
  ('revenue_os.cockpit.admin', 'Cockpit · Admin', 'Permission canonique Revenue Command OS: revenue_os.cockpit.admin.', 'restricted', 17, true),
  ('revenue_os.mega_production.view', 'Mega Production · View', 'Permission canonique Revenue Command OS: revenue_os.mega_production.view.', 'low', 17, true),
  ('revenue_os.mega_production.manage', 'Mega Production · Manage', 'Permission canonique Revenue Command OS: revenue_os.mega_production.manage.', 'controlled', 17, true),
  ('revenue_os.mega_production.activate', 'Mega Production · Activate', 'Permission canonique Revenue Command OS: revenue_os.mega_production.activate.', 'restricted', 17, true),
  ('revenue_os.mega_production.emergency_stop', 'Mega Production · Emergency Stop', 'Permission canonique Revenue Command OS: revenue_os.mega_production.emergency_stop.', 'restricted', 17, true),
  ('revenue_os.mega_production.admin', 'Mega Production · Admin', 'Permission canonique Revenue Command OS: revenue_os.mega_production.admin.', 'restricted', 17, true),
  ('revenue_os.experiments.view', 'Experiments · View', 'Permission canonique Revenue Command OS: revenue_os.experiments.view.', 'low', 17, true),
  ('revenue_os.experiments.manage', 'Experiments · Manage', 'Permission canonique Revenue Command OS: revenue_os.experiments.manage.', 'controlled', 17, true),
  ('revenue_os.learning.manage', 'Learning · Manage', 'Permission canonique Revenue Command OS: revenue_os.learning.manage.', 'controlled', 17, true),
  ('revenue_os.queues.manage', 'Queues · Manage', 'Permission canonique Revenue Command OS: revenue_os.queues.manage.', 'controlled', 17, true),
  ('revenue_os.registries.manage', 'Registries · Manage', 'Permission canonique Revenue Command OS: revenue_os.registries.manage.', 'controlled', 17, true),
  ('revenue_os.observability.view', 'Observability · View', 'Permission canonique Revenue Command OS: revenue_os.observability.view.', 'low', 17, true),
  ('revenue_os.security.review', 'Security · Review', 'Permission canonique Revenue Command OS: revenue_os.security.review.', 'low', 17, true),
  ('revenue_os.disaster_recovery.manage', 'Disaster Recovery · Manage', 'Permission canonique Revenue Command OS: revenue_os.disaster_recovery.manage.', 'controlled', 17, true),
  ('revenue_os.audit.view', 'Audit · View', 'Permission canonique Revenue Command OS: revenue_os.audit.view.', 'low', 17, true),
  ('revenue_os.settings.manage', 'Settings · Manage', 'Permission canonique Revenue Command OS: revenue_os.settings.manage.', 'controlled', 17, true)
on conflict(permission_key) do update set
  label=excluded.label,
  description=excluded.description,
  risk_class=excluded.risk_class,
  active=true,
  updated_at=timezone('utc',now());

create table if not exists public.revenue_os_command_validation_snapshots(
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  actor_id text not null,
  expected_count integer not null check(expected_count=3000),
  persisted_count integer not null default 0,
  missing_count integer not null default 0,
  drift_count integer not null default 0,
  readiness jsonb not null default '{}'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  storage_mode text not null,
  data_mode text not null,
  validated_at timestamptz not null default timezone('utc',now()),
  created_at timestamptz not null default timezone('utc',now())
);
create index if not exists revenue_os_command_validation_snapshots_tenant_idx
  on public.revenue_os_command_validation_snapshots(tenant_id,validated_at desc);

alter table public.revenue_os_command_validation_snapshots enable row level security;
revoke all on table public.revenue_os_command_validation_snapshots from anon, authenticated;
grant all on table public.revenue_os_command_validation_snapshots to service_role;

update public.revenue_os_workspaces
set label='Commandes 3000 · Bibliothèque stratégique complète',
    short_label='Commandes 3000',
    description='Bibliothèque canonique cumulative de 3 000 commandes, routage déterministe, versions, graphes, simulations, permissions et rollback.',
    href='/revenue-command-os/command-kernel',
    permission_key='revenue_os.commands.view',
    maturity_status='ready',
    updated_at=timezone('utc',now())
where workspace_key='intelligent-commands';

-- Synchronise les permissions dans la source réellement lue par APP_SESSION_COOKIE/app_users.
do $repair_permissions$
declare
  permission_type text;
  role_column text;
  keys text[] := array['revenue_os.view','revenue_os.manage','revenue_os.objectives.manage','revenue_os.digital_twin.manage','revenue_os.knowledge.manage','revenue_os.knowledge.approve','revenue_os.signals.manage','revenue_os.signals.ingest','revenue_os.signals.audit','revenue_os.strategy.view','revenue_os.strategy.manage','revenue_os.ai.view','revenue_os.ai.generate','revenue_os.ai.manage','revenue_os.council.view','revenue_os.council.run','revenue_os.council.manage','revenue_os.validation_council.view','revenue_os.strategy_studio.view','revenue_os.strategy_studio.review','revenue_os.strategy_studio.approve','revenue_os.strategy_studio.approve_financial','revenue_os.strategy_studio.approve_capacity','revenue_os.strategy_studio.manage_approval_class','revenue_os.strategy_studio.export_memo','revenue_os.strategy_studio.manage','revenue_os.commands.view','revenue_os.commands.simulate','revenue_os.commands.execute','revenue_os.commands.approve','revenue_os.commands.manage','revenue_os.commands.audit','revenue_os.commands.rollback','revenue_os.approvals.manage','revenue_os.mission_compiler.view','revenue_os.mission_compiler.compile','revenue_os.mission_compiler.recompile','revenue_os.mission_compiler.resolve','revenue_os.mission_compiler.rollback','revenue_os.mission_compiler.prepare_propagation','revenue_os.mission_compiler.accept_risk','revenue_os.execution.view','revenue_os.execution.prepare','revenue_os.execution.activate','revenue_os.execution.approve','revenue_os.execution.operate','revenue_os.execution.rollback','revenue_os.execution.admin','revenue_os.cockpit.view','revenue_os.cockpit.executive_view','revenue_os.cockpit.commercial_view','revenue_os.cockpit.operations_view','revenue_os.cockpit.finance_view','revenue_os.cockpit.export','revenue_os.cockpit.intervene','revenue_os.cockpit.assign_intervention','revenue_os.cockpit.resolve_exception','revenue_os.cockpit.manage_views','revenue_os.cockpit.admin','revenue_os.mega_production.view','revenue_os.mega_production.manage','revenue_os.mega_production.activate','revenue_os.mega_production.emergency_stop','revenue_os.mega_production.admin','revenue_os.experiments.view','revenue_os.experiments.manage','revenue_os.learning.manage','revenue_os.queues.manage','revenue_os.registries.manage','revenue_os.observability.view','revenue_os.security.review','revenue_os.disaster_recovery.manage','revenue_os.audit.view','revenue_os.settings.manage']::text[];
begin
  if to_regclass('public.app_users') is null then
    raise notice 'app_users absent: affectation RBAC différée.';
    return;
  end if;

  select case
    when exists(select 1 from information_schema.columns where table_schema='public' and table_name='app_users' and column_name='role_key') then 'role_key'
    when exists(select 1 from information_schema.columns where table_schema='public' and table_name='app_users' and column_name='role') then 'role'
    else null end into role_column;

  select data_type into permission_type
  from information_schema.columns
  where table_schema='public' and table_name='app_users' and column_name='permissions';

  if role_column is null or permission_type is null then
    raise notice 'Colonnes app_users.role/permissions non compatibles: affectation différée.';
    return;
  end if;

  if permission_type='jsonb' then
    execute format($sql$
      update public.app_users u
      set permissions=(
        select coalesce(jsonb_agg(value order by value),'[]'::jsonb)
        from (
          select distinct value
          from jsonb_array_elements_text(coalesce(u.permissions,'[]'::jsonb))
          union
          select unnest($1)
        ) merged
      )
      where lower(replace(replace(coalesce(u.%I::text,''),'-','_'),' ','_'))
        in ('ceo','direction','admin','super_admin','managing_director','director_general','dg','revenue_admin')
    $sql$,role_column) using keys;
  elsif permission_type='ARRAY' then
    execute format($sql$
      update public.app_users u
      set permissions=array(
        select distinct value
        from unnest(coalesce(u.permissions,'{}'::text[]) || $1) value
        order by value
      )
      where lower(replace(replace(coalesce(u.%I::text,''),'-','_'),' ','_'))
        in ('ceo','direction','admin','super_admin','managing_director','director_general','dg','revenue_admin')
    $sql$,role_column) using keys;
  else
    raise notice 'Type app_users.permissions non pris en charge: %',permission_type;
  end if;
end
$repair_permissions$;

insert into public.revenue_os_installations(
  installation_key,contract_version,release_code,module_version,environment,
  execution_mode,contract_locked,external_actions_enabled,metadata
) values(
  'revenue-command-os',
  'AC-REVENUE-OS-CANONICAL-2026.07',
  'AC-REVENUE-OS-MZ17-PRODUCTION-CONSISTENCY-REPAIR',
  '17.0.0-repair',
  'production','shadow',true,false,
  jsonb_build_object(
    'cumulativeOver',jsonb_build_array('MZ01','MZ02','MZ03','MZ04','MZ05','MZ06','MZ07','MZ08','MZ09','MZ10','MZ11','MZ12','MZ13','MZ14','MZ15','MZ16'),
    'authContract','APP_SESSION_COOKIE/app_sessions/app_users',
    'tenantBinding','server-derived',
    'permissionRegistryCount',74,
    'commandAuthority','canonical-3000-overlay',
    'externalActions',false
  )
)
on conflict(installation_key) do update set
  contract_version=excluded.contract_version,
  release_code=excluded.release_code,
  module_version=excluded.module_version,
  environment=excluded.environment,
  execution_mode='shadow',
  contract_locked=true,
  external_actions_enabled=false,
  metadata=excluded.metadata,
  updated_at=timezone('utc',now());

insert into public.revenue_os_system_checks(check_key,label,status,detail,recommended_action,metadata)
values(
  'revenue-os-production-consistency',
  'Cohérence production Revenue Command OS',
  case when (select count(*) from public.revenue_os_command_definitions)=3000 then 'operational' else 'attention' end,
  format('Registre persisté: %s/3000 commandes. Auth, tenant et permissions MZ17 installés.',(select count(*) from public.revenue_os_command_definitions)),
  case when (select count(*) from public.revenue_os_command_definitions)=3000 then null else 'Exécuter tools/revenue-os/repair-command-library-3000.mjs --apply puis persister un snapshot de validation.' end,
  jsonb_build_object('expectedCommands',3000,'externalActionsEnabled',false,'checkedAt',timezone('utc',now()))
)
on conflict(check_key) do update set
  status=excluded.status,detail=excluded.detail,recommended_action=excluded.recommended_action,
  metadata=excluded.metadata,checked_at=timezone('utc',now()),updated_at=timezone('utc',now());

insert into public.revenue_os_audit_events(
  event_id,action,actor_label,actor_type,resource_type,outcome,summary,metadata
) values(
  'REVOS-MZ17-REPAIR-'||replace(gen_random_uuid()::text,'-',''),
  'production.consistency.repair.installed','Revenue OS Migration','migration',
  'revenue_command_os','success','MZ17 Production Consistency Repair installé.',
  jsonb_build_object('authUnified',true,'tenantServerBound',true,'permissions',74,'externalActions',false)
);

commit;
