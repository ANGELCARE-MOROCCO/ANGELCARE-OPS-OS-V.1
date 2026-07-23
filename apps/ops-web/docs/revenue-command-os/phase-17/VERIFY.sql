-- Revenue Command OS MZ17 — production verification
-- Read-only. Run after the MZ17 migration and after the optional Commands 3000 repair.

select installation_key, release_code, module_version, execution_mode,
       contract_locked, external_actions_enabled, metadata
from public.revenue_os_installations
where installation_key='revenue-command-os';

select count(*) as active_permission_count
from public.revenue_os_permission_registry
where active=true and permission_key like 'revenue_os.%';

select workspace_key, label, short_label, permission_key, maturity_status
from public.revenue_os_workspaces
where workspace_key='intelligent-commands';

select
  count(*) as persisted_commands,
  count(distinct command_code) as distinct_command_codes,
  count(*) filter (where status='active') as active_commands
from public.revenue_os_command_definitions;

select command_code, count(*) as duplicates
from public.revenue_os_command_definitions
group by command_code
having count(*) > 1
order by duplicates desc, command_code;

select expected_count, persisted_count, missing_count, drift_count,
       storage_mode, data_mode, validated_at
from public.revenue_os_command_validation_snapshots
order by validated_at desc
limit 10;

select check_key, status, detail, recommended_action, checked_at
from public.revenue_os_system_checks
where check_key='revenue-os-production-consistency';

select event_id, action, outcome, summary, created_at
from public.revenue_os_audit_events
where action='production.consistency.repair.installed'
order by created_at desc
limit 5;

-- Acceptance expectations:
-- external_actions_enabled = false
-- workspace short_label = Commandes 3000
-- active_permission_count matches the canonical MZ17 catalogue
-- persisted_commands = distinct_command_codes = 3000 after repair
-- duplicate query returns zero rows
