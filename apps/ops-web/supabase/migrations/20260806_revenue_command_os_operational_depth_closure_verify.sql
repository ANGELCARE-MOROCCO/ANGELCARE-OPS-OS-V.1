-- ANGELCARE Revenue Command OS — Operational Depth Closure Verification
DO $$
BEGIN
  IF to_regclass('public.revenue_os_entity_relations') IS NULL THEN RAISE EXCEPTION 'ENTITY_RELATIONS_MISSING'; END IF;
  IF to_regclass('public.revenue_os_entity_notes') IS NULL THEN RAISE EXCEPTION 'ENTITY_NOTES_MISSING'; END IF;
  IF to_regclass('public.revenue_os_saved_views') IS NULL THEN RAISE EXCEPTION 'SAVED_VIEWS_MISSING'; END IF;
  IF to_regclass('public.revenue_os_outcome_records') IS NULL THEN RAISE EXCEPTION 'OUTCOME_RECORDS_MISSING'; END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('revenue_os_programs','revenue_os_missions','revenue_os_mission_tasks')
      AND column_name IN ('compilation_run_id','strategy_id')
      AND is_nullable = 'NO'
  ) THEN RAISE EXCEPTION 'MANUAL_OPERATIONAL_ENTITY_COLUMNS_STILL_BLOCKED'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.revenue_os_installations
    WHERE installation_key = 'revenue-command-os'
      AND release_code = 'AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE'
      AND module_version = '18.0.0-operational-depth'
      AND execution_mode = 'live'
      AND contract_locked = false
      AND external_actions_enabled = true
      AND coalesce((metadata->>'operationalDepth')::boolean, false) = true
      AND coalesce((metadata->>'workspaceSynchronization')::boolean, false) = true
      AND coalesce((metadata->>'approvalGates')::boolean, true) = false
      AND coalesce((metadata->>'shadowMode')::boolean, true) = false
      AND coalesce((metadata->>'governanceHolds')::boolean, true) = false
  ) THEN RAISE EXCEPTION 'OPERATIONAL_DEPTH_INSTALLATION_NOT_ACTIVE'; END IF;
END $$;
SELECT 'OPERATIONAL_DEPTH_DATABASE_VERIFIED' AS result, timezone('utc', now()) AS verified_at;
