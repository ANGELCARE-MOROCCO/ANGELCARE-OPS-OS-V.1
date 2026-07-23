begin;

-- ANGELCARE Revenue Command OS — MZ19 Runtime, Tenant & Truth Integrity
-- Additive and idempotent. It does not enable external actions and does not
-- replace the verified Commands 3000 + 12 protected foundation model.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Canonical server-side Revenue OS tenant binding for ANGELCARE internal
--    users. The UUID is the stable md5 UUID of the canonical key
--    "angelcare-main" and matches lib/revenue-command-os/access.ts.
-- ---------------------------------------------------------------------------
do $mz19_app_user_binding$
begin
  if to_regclass('public.app_users') is null then
    raise exception 'MZ19 requires public.app_users; authentication baseline is missing.';
  end if;

  alter table public.app_users
    add column if not exists revenue_os_tenant_id text;

  alter table public.app_users
    add column if not exists revenue_os_tenant_uuid uuid;
end
$mz19_app_user_binding$;

create index if not exists app_users_revenue_os_tenant_idx
  on public.app_users(revenue_os_tenant_id, revenue_os_tenant_uuid);

do $mz19_bind_privileged_users$
declare
  role_column text;
begin
  select case
    when exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='app_users' and column_name='role_key'
    ) then 'role_key'
    when exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='app_users' and column_name='role'
    ) then 'role'
    else null
  end into role_column;

  if role_column is null then
    raise exception 'MZ19 cannot resolve app_users role/role_key column.';
  end if;

  execute format($sql$
    update public.app_users u
    set
      revenue_os_tenant_id = coalesce(nullif(trim(u.revenue_os_tenant_id), ''), 'angelcare-main'),
      revenue_os_tenant_uuid = coalesce(u.revenue_os_tenant_uuid, md5('angelcare-main')::uuid)
    where lower(replace(replace(coalesce(u.%I::text,''),'-','_'),' ','_'))
      in (
        'ceo','owner','direction','admin','super_admin','managing_director',
        'director_general','dg','revenue_admin'
      )
  $sql$, role_column);
end
$mz19_bind_privileged_users$;

-- Server-only resolver contract. The application remains authoritative for
-- permission checks; this function makes the persisted binding auditable.
create or replace function public.revenue_os_resolve_tenant_binding(p_user_id uuid)
returns table(tenant_id text, tenant_uuid uuid, binding_source text)
language sql
security definer
set search_path = public
as $$
  select
    nullif(trim(u.revenue_os_tenant_id), '') as tenant_id,
    u.revenue_os_tenant_uuid as tenant_uuid,
    case
      when nullif(trim(u.revenue_os_tenant_id), '') is not null
       and u.revenue_os_tenant_uuid is not null
      then 'app_users'
      else 'missing'
    end as binding_source
  from public.app_users u
  where u.id = p_user_id
  limit 1
$$;

revoke all on function public.revenue_os_resolve_tenant_binding(uuid) from public, anon, authenticated;
grant execute on function public.revenue_os_resolve_tenant_binding(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Product-facing workspace terminology. Technical MZ lineage remains in
--    migrations, audit and release metadata, not daily navigation.
-- ---------------------------------------------------------------------------
update public.revenue_os_workspaces
set short_label = case workspace_key
  when 'premium-cockpit' then 'Cockpit exécutif'
  when 'validation-council' then 'Conseil stratégique'
  when 'strategy-studio' then 'Studio de décision'
  when 'mission-compiler' then 'Compilateur de missions'
  when 'execution-autopilot' then 'Pilotage d’exécution'
  else short_label
end,
updated_at = timezone('utc', now())
where workspace_key in (
  'premium-cockpit',
  'validation-council',
  'strategy-studio',
  'mission-compiler',
  'execution-autopilot'
);

-- Accommodate repositories where the cockpit key predates MZ15 naming.
update public.revenue_os_workspaces
set short_label='Cockpit exécutif', updated_at=timezone('utc',now())
where workspace_key='cockpit';

-- ---------------------------------------------------------------------------
-- 3. Preserve and certify the verified Commands 3000 model truthfully:
--    3000 canonical + 12 protected foundation anchors = 3012 definitions.
-- ---------------------------------------------------------------------------
with command_truth as (
  select
    count(*)::integer as total_definitions,
    count(distinct command_code)::integer as distinct_codes,
    count(*) filter (
      where coalesce(tags, '[]'::jsonb) ? 'foundation'
         or command_code = any(array[
           'REV-APPROVAL-PRICING-EXCEPTION',
           'REV-AUDIT-ROUTING-DECISION',
           'REV-CHAIN-ACCOUNT-QUALIFICATION',
           'REV-CHAIN-DECISION-MAKER-RESEARCH',
           'REV-CONDITION-MISSING-DECISION-MAKER',
           'REV-EVENT-POSITIVE-REPLY-TRIAGE',
           'REV-FALLBACK-REQUEST-CAPACITY-CONTEXT',
           'REV-MANUAL-ACCOUNT-READINESS',
           'REV-OFFER-RECOMMENDATION-SHADOW',
           'REV-REJECT-EXTERNAL-MESSAGE',
           'REV-SCHEDULED-STALE-OPPORTUNITY-SCAN',
           'REV-SIMULATE-STALL-RESCUE'
         ])
    )::integer as foundation_commands
  from public.revenue_os_command_definitions
), evaluated as (
  select
    *,
    (total_definitions - foundation_commands)::integer as canonical_commands,
    (total_definitions - distinct_codes)::integer as duplicate_rows
  from command_truth
)
update public.revenue_os_system_checks c
set
  status = case
    when e.canonical_commands=3000
     and e.foundation_commands=12
     and e.total_definitions=3012
     and e.duplicate_rows=0
    then 'operational'
    else 'attention'
  end,
  detail = format(
    'Registre validé : %s commandes canoniques + %s ancres fondatrices protégées (%s définitions uniques).',
    e.canonical_commands,
    e.foundation_commands,
    e.distinct_codes
  ),
  recommended_action = case
    when e.canonical_commands=3000
     and e.foundation_commands=12
     and e.total_definitions=3012
     and e.duplicate_rows=0
    then null
    else 'Auditer le registre Commands 3000 sans supprimer les 12 ancres de fallback protégées.'
  end,
  metadata = coalesce(c.metadata, '{}'::jsonb) || jsonb_build_object(
    'expectedCanonicalCommands', 3000,
    'persistedCanonicalCommands', e.canonical_commands,
    'foundationCommands', e.foundation_commands,
    'totalPersistedDefinitions', e.total_definitions,
    'distinctCommandCodes', e.distinct_codes,
    'duplicateRows', e.duplicate_rows,
    'foundationModel', 'protected-fallback-anchors',
    'externalActionsEnabled', false,
    'checkedAt', timezone('utc', now())
  ),
  checked_at = timezone('utc', now()),
  updated_at = timezone('utc', now())
from evaluated e
where c.check_key='revenue-os-production-consistency';

-- ---------------------------------------------------------------------------
-- 4. Runtime/truth readiness evidence. Signal Fabric remains a required
--    additive prerequisite; this check reports rather than fabricates it.
-- ---------------------------------------------------------------------------
insert into public.revenue_os_system_checks(
  check_key,label,status,detail,recommended_action,metadata
)
select
  'revenue-os-mz19-runtime-tenant-truth',
  'Intégrité runtime, tenant et vérité MZ19',
  case
    when to_regclass('public.revenue_os_signal_sources') is not null
     and exists(
       select 1 from public.app_users
       where revenue_os_tenant_id='angelcare-main'
         and revenue_os_tenant_uuid=md5('angelcare-main')::uuid
     )
    then 'operational'
    else 'attention'
  end,
  case
    when to_regclass('public.revenue_os_signal_sources') is not null
    then 'Résolution tenant persistée et registre Signal Fabric disponible.'
    else 'Résolution tenant persistée; migration Signal Fabric Phase 4 encore requise.'
  end,
  case
    when to_regclass('public.revenue_os_signal_sources') is null
    then 'Appliquer la migration existante 20260720_revenue_command_os_phase4_signal_fabric.sql puis relancer la vérification MZ19.'
    else null
  end,
  jsonb_build_object(
    'canonicalTenantId','angelcare-main',
    'canonicalTenantUuid',md5('angelcare-main')::uuid,
    'tenantBinding','server-derived-and-persisted',
    'signalFabricInstalled',to_regclass('public.revenue_os_signal_sources') is not null,
    'externalActionsEnabled',false,
    'checkedAt',timezone('utc',now())
  )
on conflict(check_key) do update set
  label=excluded.label,
  status=excluded.status,
  detail=excluded.detail,
  recommended_action=excluded.recommended_action,
  metadata=excluded.metadata,
  checked_at=timezone('utc',now()),
  updated_at=timezone('utc',now());

-- ---------------------------------------------------------------------------
-- 5. Release metadata and immutable audit evidence.
-- ---------------------------------------------------------------------------
update public.revenue_os_installations
set
  release_code='AC-REVENUE-OS-MZ19-RUNTIME-TENANT-TRUTH-INTEGRITY',
  module_version='19.0.0',
  execution_mode='shadow',
  contract_locked=true,
  external_actions_enabled=false,
  metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
    'runtimeResponseIntegrity',true,
    'tenantBinding','server-derived-and-persisted',
    'dataTruthStates',jsonb_build_array('live','shadow','preview','degraded','empty','locked','offline','initializing'),
    'commandsModel','3000-canonical-plus-12-foundation',
    'externalActions',false,
    'mz19AppliedAt',timezone('utc',now())
  ),
  updated_at=timezone('utc',now())
where installation_key='revenue-command-os';

insert into public.revenue_os_audit_events(
  event_id,action,actor_label,actor_type,resource_type,outcome,summary,metadata
) values(
  'REVOS-MZ19-'||replace(gen_random_uuid()::text,'-',''),
  'runtime.tenant_truth_integrity.installed',
  'Revenue OS Migration',
  'migration',
  'revenue_command_os',
  'success',
  'MZ19 a persisté le tenant canonique, normalisé la vérité opérationnelle et conservé les garde-fous Shadow.',
  jsonb_build_object(
    'canonicalTenantId','angelcare-main',
    'canonicalTenantUuid',md5('angelcare-main')::uuid,
    'externalActionsEnabled',false
  )
);

commit;
