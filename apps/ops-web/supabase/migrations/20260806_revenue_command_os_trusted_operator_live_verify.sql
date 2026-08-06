DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND execution_mode='live' AND contract_locked=false AND external_actions_enabled=true) THEN RAISE EXCEPTION 'INSTALLATION_NOT_LIVE'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_objectives WHERE execution_mode<>'live') THEN RAISE EXCEPTION 'OBJECTIVE_MODE_DRIFT'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_propagation_runs WHERE execution_mode<>'live') THEN RAISE EXCEPTION 'PROPAGATION_MODE_DRIFT'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_execution_actions WHERE execution_mode<>'live' OR approval_required) THEN RAISE EXCEPTION 'EXECUTION_GATE_DRIFT'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_command_definitions WHERE status<>'approved' OR approval_class<>'none') THEN RAISE EXCEPTION 'COMMAND_GATE_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='revenue_os_execution_actions_live_integrity_guard') THEN RAISE EXCEPTION 'LIVE_INTEGRITY_TRIGGER_MISSING'; END IF;
 IF to_regclass('public.revenue_os_operational_exceptions') IS NULL THEN RAISE EXCEPTION 'EXCEPTIONS_TABLE_MISSING'; END IF;
END $$;
SELECT 'TRUSTED_OPERATOR_LIVE_DATABASE_VERIFIED' AS result;
