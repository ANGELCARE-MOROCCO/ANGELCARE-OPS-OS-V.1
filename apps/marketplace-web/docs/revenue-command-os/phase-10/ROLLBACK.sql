BEGIN;
DROP TABLE IF EXISTS public.revenue_os_strategy_audit_events CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_model_runs CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_tool_traces CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_combination_lineage CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_combinations CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_comparison_scores CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_comparisons CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_predictions CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_capacity_requirements CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_resource_requirements CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_evidence_links CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_stop_conditions CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_fallbacks CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_risks CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_assumptions CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_scenarios CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_components CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_versions CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategies CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_command_selections CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_command_candidates CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_assembly_runs CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_context_snapshots CASCADE;
DROP TABLE IF EXISTS public.revenue_os_objective_constraints CASCADE;
DROP TABLE IF EXISTS public.revenue_os_strategy_objectives CASCADE;
UPDATE public.revenue_os_installations
SET release_code = 'AC-REVENUE-OS-MZ09-COMMANDS-3000',
    module_version = '9.0.0-phase9',
    execution_mode = 'shadow',
    contract_locked = true,
    external_actions_enabled = false,
    metadata = (metadata - 'strategyBrain' - 'minimumCompetingStrategies' - 'currentPhase') || jsonb_build_object('currentPhase','MZ09'),
    updated_at = timezone('utc', now())
WHERE installation_key = 'revenue-command-os';
COMMIT;
