\set ON_ERROR_STOP on
select release_code,exact_command_count,family_count,evaluation_case_count,status,execution_mode,external_actions_enabled from public.revenue_os_command_releases where release_code='AC-REVENUE-OS-MZ08-COMMANDS-2000';
select count(*) as active_library_commands from public.revenue_os_command_library_active;
select count(*) filter(where tags ? 'golden-300') as golden_300,count(*) filter(where tags ? 'new-700') as mz07_new_700,count(*) filter(where tags ? 'new-1000') as mz08_new_1000,count(*) as exact_total from public.revenue_os_command_library_active;
select coverage_domain,expected_count,actual_count,authority_guarded,margin_guarded,capacity_guarded,evidence_guarded from public.revenue_os_command_monetization_coverage where release_code='AC-REVENUE-OS-MZ08-COMMANDS-2000' order by coverage_domain;
select benchmark_code,library_size,case_count,authority_preservation,margin_preservation,capacity_preservation,evidence_preservation,external_action_count from public.revenue_os_command_monetization_benchmarks where release_code='AC-REVENUE-OS-MZ08-COMMANDS-2000';
