\set ON_ERROR_STOP on
begin;
-- Remove MZ09 final commands and dependent normalized rows through FK cascades where configured.
delete from public.revenue_os_command_test_cases where case_code like 'MZ09-EVAL-%';
delete from public.revenue_os_command_graph_nodes where graph_id in(select id from public.revenue_os_command_graphs where code like 'GRAPH-MZ09-%');
delete from public.revenue_os_command_graphs where code like 'GRAPH-MZ09-%';
delete from public.revenue_os_command_schedules where code like 'SCH-MZ09-%';
delete from public.revenue_os_command_triggers where code like 'TRG-MZ09-%';
delete from public.revenue_os_command_definitions where tags ? 'final-1000';
-- Restore the 109 MZ08 commands from the preserved reconciliation ledger.
update public.revenue_os_command_definitions d set family_code=r.from_family,active_version=r.from_version,tags=(d.tags - 'mz09-reclassified' - 'taxonomy-reconciled' - r.to_family) || jsonb_build_array(r.from_family),updated_at=now()
from public.revenue_os_command_taxonomy_reconciliations r where r.release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000' and d.command_code=r.command_code;
delete from public.revenue_os_command_versions where version='2.0.0' and command_code in(select command_code from public.revenue_os_command_taxonomy_reconciliations where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000');
delete from public.revenue_os_command_health_profiles where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_staleness_reviews where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_performance_baselines where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_suppression_policies where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_coverage_gaps where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_semantic_review_summaries where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_library_benchmarks where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_taxonomy_reconciliations where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
delete from public.revenue_os_command_releases where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
create or replace view public.revenue_os_command_library_active with (security_invoker = true) as select * from public.revenue_os_command_definitions where tags ? 'golden-300' or tags ? 'new-700' or tags ? 'new-1000';
commit;
