-- ANGELCARE Revenue Command OS — Operational Depth Closure Preflight
DO $$
DECLARE missing text[] := ARRAY[]::text[];
BEGIN
  IF to_regclass('public.revenue_os_programs') IS NULL THEN missing := array_append(missing, 'revenue_os_programs'); END IF;
  IF to_regclass('public.revenue_os_missions') IS NULL THEN missing := array_append(missing, 'revenue_os_missions'); END IF;
  IF to_regclass('public.revenue_os_mission_tasks') IS NULL THEN missing := array_append(missing, 'revenue_os_mission_tasks'); END IF;
  IF to_regclass('public.revenue_os_objectives') IS NULL THEN missing := array_append(missing, 'revenue_os_objectives'); END IF;
  IF to_regclass('public.revenue_os_strategies') IS NULL THEN missing := array_append(missing, 'revenue_os_strategies'); END IF;
  IF to_regclass('public.revenue_os_operational_exceptions') IS NULL THEN missing := array_append(missing, 'revenue_os_operational_exceptions'); END IF;
  IF to_regclass('public.revenue_os_command_schedules') IS NULL THEN missing := array_append(missing, 'revenue_os_command_schedules'); END IF;
  IF to_regclass('public.revenue_os_registry_entries') IS NULL THEN missing := array_append(missing, 'revenue_os_registry_entries'); END IF;
  IF array_length(missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'OPERATIONAL_DEPTH_PREFLIGHT_MISSING:%', array_to_string(missing, ',');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.revenue_os_installations
    WHERE installation_key = 'revenue-command-os'
      AND execution_mode = 'live'
      AND contract_locked = false
      AND external_actions_enabled = true
  ) THEN RAISE EXCEPTION 'TRUSTED_OPERATOR_LIVE_BASELINE_REQUIRED'; END IF;
END $$;
SELECT 'OPERATIONAL_DEPTH_PREFLIGHT_PASSED' AS result;
