\set ON_ERROR_STOP on
\echo '=== MZ09 release ==='
select release_code,exact_command_count,family_count,evaluation_case_count,status,execution_mode,external_actions_enabled
from public.revenue_os_command_releases where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
\echo '=== Exact operational count ==='
select count(*) as active_library_commands from public.revenue_os_command_library_active;
\echo '=== Release composition ==='
select
 count(*) filter(where tags ? 'golden-300') as golden_300,
 count(*) filter(where tags ? 'new-700') as mz07_new_700,
 count(*) filter(where tags ? 'new-1000') as mz08_new_1000,
 count(*) filter(where tags ? 'final-1000') as mz09_final_1000,
 count(*) as exact_total
from public.revenue_os_command_library_active;
\echo '=== Canonical family reconciliation ==='
select family_code,count(*) as actual_count,f.target_count as expected_count,count(*)-f.target_count as variance
from public.revenue_os_command_library_active d join public.revenue_os_command_families f on f.code=d.family_code
group by family_code,f.target_count order by family_code;
\echo '=== Health / staleness / performance ==='
select
 (select count(*) from public.revenue_os_command_health_profiles where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000' and health_status='healthy') as healthy,
 (select count(*) from public.revenue_os_command_staleness_reviews where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000' and status='fresh') as fresh,
 (select count(*) from public.revenue_os_command_performance_baselines where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000' and external_actions=0) as measured_safe;
\echo '=== Coverage gaps ==='
select dimension,gap_key,expected_count,actual_count,gap_count,severity,status
from public.revenue_os_command_coverage_gaps where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000' order by dimension,gap_key;
\echo '=== Semantic integrity ==='
select commands_reviewed,possible_pairs,exact_code_duplicates,exact_name_duplicates,exact_purpose_duplicates,undocumented_semantic_duplicates,documented_functional_variants,review_status
from public.revenue_os_command_semantic_review_summaries where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
\echo '=== Benchmark ==='
select library_size,case_count,candidate_precision,candidate_recall,deterministic_rate,idempotency_rate,external_action_count,tenant_leakage_count
from public.revenue_os_command_library_benchmarks where release_code='AC-REVENUE-OS-MZ09-COMMANDS-3000';
\echo '=== Prohibited enabled tools — must be 0 ==='
select count(*) as prohibited_enabled_tools from public.revenue_os_command_library_active d cross join lateral jsonb_array_elements(d.tool_permissions) t
where coalesce((t->>'allowed')::boolean,false)=true and t->>'toolCode' in('send_email','send_whatsapp','place_call','apply_discount','commit_price','confirm_capacity','sign_contract','release_payment');
