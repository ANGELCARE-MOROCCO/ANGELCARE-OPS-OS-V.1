\pset pager off
SELECT installation_key,release_code,module_version,execution_mode,contract_locked,external_actions_enabled,
 metadata->>'currentPhase' AS current_phase,metadata->>'strategyStudio' AS strategy_studio,
 metadata->>'mandatoryActions' AS mandatory_actions,metadata->>'implementedWorkspaces' AS workspaces,
 metadata->>'humanApprovalOnly' AS human_approval_only
FROM public.revenue_os_installations WHERE installation_key='revenue-command-os';
SELECT count(*) AS studio_tables FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'revenue_os_%' AND table_name IN (
'revenue_os_strategy_studio_sessions','revenue_os_executive_reviews','revenue_os_approval_requests','revenue_os_approval_requirements','revenue_os_approval_decisions','revenue_os_approval_conditions','revenue_os_strategy_amendments','revenue_os_reanalysis_requests','revenue_os_evidence_requests','revenue_os_objective_change_requests','revenue_os_constraint_changes','revenue_os_approval_class_changes','revenue_os_strategy_studio_combinations','revenue_os_executive_memos','revenue_os_memo_versions','revenue_os_strategy_archives','revenue_os_strategy_reopenings','revenue_os_strategy_studio_audit_events');
SELECT count(*) AS active_mz11_agents FROM public.revenue_os_council_agents WHERE status='active';
SELECT count(*) AS external_action_violations FROM (
 SELECT external_actions FROM public.revenue_os_strategy_studio_sessions WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_executive_reviews WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_approval_requests WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_approval_decisions WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_strategy_amendments WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_reanalysis_requests WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_evidence_requests WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_strategy_studio_combinations WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_executive_memos WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_strategy_archives WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_strategy_reopenings WHERE external_actions<>0
 UNION ALL SELECT external_actions FROM public.revenue_os_strategy_studio_audit_events WHERE external_actions<>0
) violations;
DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('revenue_os_strategy_studio_sessions','revenue_os_executive_reviews','revenue_os_approval_requests','revenue_os_approval_requirements','revenue_os_approval_decisions','revenue_os_approval_conditions','revenue_os_strategy_amendments','revenue_os_reanalysis_requests','revenue_os_evidence_requests','revenue_os_objective_change_requests','revenue_os_constraint_changes','revenue_os_approval_class_changes','revenue_os_strategy_studio_combinations','revenue_os_executive_memos','revenue_os_memo_versions','revenue_os_strategy_archives','revenue_os_strategy_reopenings','revenue_os_strategy_studio_audit_events'))<>18 THEN RAISE EXCEPTION 'MZ12 verification failed: table count'; END IF;
 IF (SELECT count(*) FROM public.revenue_os_council_agents WHERE status='active')<>10 THEN RAISE EXCEPTION 'MZ12 verification failed: MZ11 agents'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND (execution_mode<>'shadow' OR external_actions_enabled)) THEN RAISE EXCEPTION 'MZ12 verification failed: safety lock'; END IF;
END $$;
