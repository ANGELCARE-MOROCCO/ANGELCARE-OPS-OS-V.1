-- Read-only preflight for the Global Authorization Command migration.
-- It reports object-name conflicts and does not mutate the database.

with expected_tables(name) as (
  values
    ('access_scanner_capabilities'),
    ('access_scanner_jobs'),
    ('access_scan_inventory_items'),
    ('access_scan_work_items'),
    ('access_authorization_evidence'),
    ('access_topology_nodes'),
    ('access_topology_edges'),
    ('access_authority_manifests'),
    ('access_manual_mappings'),
    ('access_reconciliation_findings'),
    ('access_reconciliation_plans'),
    ('access_plan_operations'),
    ('access_plan_approvals'),
    ('access_execution_runs'),
    ('access_execution_checkpoints'),
    ('access_verification_results'),
    ('access_rollback_packages'),
    ('access_authorization_cache_epoch'),
    ('access_command_events')
)
select
  expected.name,
  to_regclass(format('public.%I', expected.name)) as existing_object,
  case
    when to_regclass(format('public.%I', expected.name)) is null then 'READY_TO_CREATE'
    else 'REVIEW_EXISTING_OBJECT'
  end as preflight_status
from expected_tables expected
order by expected.name;

select
  routine_name,
  data_type,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name like 'access_governance_%'
order by routine_name;
