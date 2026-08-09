begin transaction read only;

with
required_relations(relation_name) as (
  values
    ('angelcare_marketplace_modules'),
    ('angelcare_marketplace_permissions'),
    ('angelcare_marketplace_role_permissions'),
    ('angelcare_marketplace_catalog_items'),
    ('angelcare_marketplace_conversion_sessions'),
    ('angelcare_marketplace_journeys'),
    ('angelcare_marketplace_fulfillment_cases'),
    ('angelcare_marketplace_reconciliation_cases'),
    ('angelcare_marketplace_metric_definitions'),
    ('angelcare_marketplace_security_controls'),
    ('angelcare_marketplace_qa_runs'),
    ('angelcare_marketplace_launch_gates'),
    ('angelcare_marketplace_release_records'),
    ('angelcare_marketplace_monitoring_events')
),
relation_checks as (
  select
    relation_name,
    to_regclass('public.' || relation_name) is not null as present
  from required_relations
),
required_permissions(permission_key) as (
  values
    ('marketplace.intelligence.view'),
    ('marketplace.intelligence.metrics.manage'),
    ('marketplace.growth.view'),
    ('marketplace.growth.experiments.manage'),
    ('marketplace.performance.view'),
    ('marketplace.security.assess'),
    ('marketplace.launch.approve'),
    ('marketplace.launch.monitoring')
),
permission_checks as (
  select
    rp.permission_key,
    p.permission_key is not null as present
  from required_permissions rp
  left join public.angelcare_marketplace_permissions p
    on p.permission_key = rp.permission_key
),
marketplace_tables as (
  select
    c.oid,
    c.relname,
    c.relrowsecurity,
    has_table_privilege('anon', c.oid, 'SELECT')
      or has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE')
      or has_table_privilege('anon', c.oid, 'DELETE') as anon_has_direct_dml,
    has_table_privilege('authenticated', c.oid, 'SELECT')
      or has_table_privilege('authenticated', c.oid, 'INSERT')
      or has_table_privilege('authenticated', c.oid, 'UPDATE')
      or has_table_privilege('authenticated', c.oid, 'DELETE') as authenticated_has_direct_dml,
    has_table_privilege('service_role', c.oid, 'SELECT')
      and has_table_privilege('service_role', c.oid, 'INSERT')
      and has_table_privilege('service_role', c.oid, 'UPDATE')
      and has_table_privilege('service_role', c.oid, 'DELETE') as service_role_has_full_dml
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname like 'angelcare_marketplace_%'
),
module_check as (
  select
    module_key,
    status,
    enabled,
    health_status,
    introduced_by_mega_zip
  from public.angelcare_marketplace_modules
  where module_key = 'final-launch-authority-universe'
),
launch_gate_summary as (
  select
    count(*)::integer as total,
    count(*) filter (where requirement_level like 'mandatory%')::integer as mandatory,
    count(*) filter (where requirement_level like 'mandatory%' and status in ('accepted','passed','approved','complete','completed'))::integer as mandatory_accepted,
    count(*) filter (where requirement_level like 'mandatory%' and coalesce(evidence_status,'missing') <> 'accepted')::integer as mandatory_without_accepted_evidence
  from public.angelcare_marketplace_launch_gates
),
release_summary as (
  select
    count(*)::integer as total,
    count(*) filter (where status = 'approved_for_production')::integer as approved_for_production,
    count(*) filter (where status = 'released')::integer as released
  from public.angelcare_marketplace_release_records
),
summary as (
  select jsonb_build_object(
    'status', case when
      (select bool_and(present) from relation_checks)
      and (select bool_and(present) from permission_checks)
      and exists(select 1 from module_check where enabled and status = 'enabled')
      and not exists(select 1 from marketplace_tables where not relrowsecurity)
      and not exists(select 1 from marketplace_tables where anon_has_direct_dml)
      and not exists(select 1 from marketplace_tables where authenticated_has_direct_dml)
      and not exists(select 1 from marketplace_tables where not service_role_has_full_dml)
      then 'PASS'
      else 'FAIL'
    end,
    'checked_at', now(),
    'required_relations', (
      select jsonb_agg(jsonb_build_object('name', relation_name, 'present', present) order by relation_name)
      from relation_checks
    ),
    'required_permissions', (
      select jsonb_agg(jsonb_build_object('key', permission_key, 'present', present) order by permission_key)
      from permission_checks
    ),
    'module', coalesce((select to_jsonb(module_check) from module_check), '{}'::jsonb),
    'table_security', jsonb_build_object(
      'marketplace_tables', (select count(*) from marketplace_tables),
      'missing_rls', (select count(*) from marketplace_tables where not relrowsecurity),
      'anon_direct_dml', (select count(*) from marketplace_tables where anon_has_direct_dml),
      'authenticated_direct_dml', (select count(*) from marketplace_tables where authenticated_has_direct_dml),
      'service_role_missing_full_dml', (select count(*) from marketplace_tables where not service_role_has_full_dml)
    ),
    'launch_gates', (select to_jsonb(launch_gate_summary) from launch_gate_summary),
    'releases', (select to_jsonb(release_summary) from release_summary),
    'production_launch_claimed', exists(
      select 1
      from public.angelcare_marketplace_release_records
      where status in ('approved_for_production','released')
    )
  ) as result
)
select result::text from summary;

commit;
