\set ON_ERROR_STOP on
\pset pager off

select release_code, exact_command_count, family_count, evaluation_case_count,
       status, execution_mode, external_actions_enabled
from public.revenue_os_command_releases
where release_code='AC-REVENUE-OS-MZ07-COMMANDS-1000';

select count(*) as active_library_commands
from public.revenue_os_command_library_active;

select
  count(*) filter (where tags ? 'golden-300') as golden_300,
  count(*) filter (where tags ? 'new-700') as mz07_new_700,
  count(*) as exact_total
from public.revenue_os_command_library_active;

select family_code, expected_count, actual_count, approved_count,
       schema_complete_count, tested_count, prohibited_case_count
from public.revenue_os_command_coverage
where release_code='AC-REVENUE-OS-MZ07-COMMANDS-1000'
order by family_code;

select coverage_domain, expected_count, actual_count, family_count
from public.revenue_os_command_domain_coverage
where release_code='AC-REVENUE-OS-MZ07-COMMANDS-1000'
order by coverage_domain;

select library_size, case_count, candidate_precision, candidate_recall,
       deterministic_rate, idempotency_rate, external_action_count
from public.revenue_os_command_routing_health
where release_code='AC-REVENUE-OS-MZ07-COMMANDS-1000';
