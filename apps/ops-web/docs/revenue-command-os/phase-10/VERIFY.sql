\set ON_ERROR_STOP on

DO $verify$
DECLARE
  strategy_table_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.revenue_os_installations
    WHERE installation_key = 'revenue-command-os'
      AND release_code = 'AC-REVENUE-OS-MZ10-STRATEGY-BRAIN'
      AND module_version = '10.0.0-phase10'
      AND execution_mode = 'shadow'
      AND contract_locked = true
      AND external_actions_enabled = false
      AND coalesce((metadata->>'strategyBrain')::boolean,false) = true
      AND coalesce((metadata->>'minimumCompetingStrategies')::integer,0) = 5
      AND coalesce((metadata->>'commandLibrary')::integer,0) = 3000
  ) THEN
    RAISE EXCEPTION 'MZ10 installation posture verification failed';
  END IF;

  SELECT count(*) INTO strategy_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'revenue_os_strategy_objectives',
      'revenue_os_objective_constraints',
      'revenue_os_strategy_context_snapshots',
      'revenue_os_strategy_assembly_runs',
      'revenue_os_strategy_command_candidates',
      'revenue_os_strategy_command_selections',
      'revenue_os_strategies',
      'revenue_os_strategy_versions',
      'revenue_os_strategy_components',
      'revenue_os_strategy_scenarios',
      'revenue_os_strategy_assumptions',
      'revenue_os_strategy_risks',
      'revenue_os_strategy_fallbacks',
      'revenue_os_strategy_stop_conditions',
      'revenue_os_strategy_evidence_links',
      'revenue_os_strategy_resource_requirements',
      'revenue_os_strategy_capacity_requirements',
      'revenue_os_strategy_predictions',
      'revenue_os_strategy_comparisons',
      'revenue_os_strategy_comparison_scores',
      'revenue_os_strategy_combinations',
      'revenue_os_strategy_combination_lineage',
      'revenue_os_strategy_tool_traces',
      'revenue_os_strategy_model_runs',
      'revenue_os_strategy_audit_events'
    );

  IF strategy_table_count <> 25 THEN
    RAISE EXCEPTION 'MZ10 strategy table verification failed: expected 25, found %', strategy_table_count;
  END IF;
END $verify$;

SELECT
  installation_key,
  release_code,
  module_version,
  execution_mode,
  contract_locked,
  external_actions_enabled,
  metadata->>'currentPhase' AS current_phase,
  metadata->>'strategyBrain' AS strategy_brain,
  metadata->>'minimumCompetingStrategies' AS minimum_competing_strategies,
  metadata->>'commandLibrary' AS command_library
FROM public.revenue_os_installations
WHERE installation_key = 'revenue-command-os';

SELECT count(*) AS strategy_tables
FROM information_schema.tables
WHERE table_schema='public'
  AND table_name LIKE 'revenue_os_strategy%';
