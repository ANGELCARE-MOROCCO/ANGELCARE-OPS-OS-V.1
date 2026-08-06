-- ANGELCARE Revenue Command OS — Operational Depth Closure Safe Rollback
-- This removes only additive operational-depth structures. It restores NOT NULL
-- compiler columns only when no manually-authored rows would be destroyed.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.revenue_os_programs WHERE compilation_run_id IS NULL OR strategy_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.revenue_os_missions WHERE compilation_run_id IS NULL OR strategy_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.revenue_os_mission_tasks WHERE compilation_run_id IS NULL OR strategy_id IS NULL)
  THEN
    RAISE EXCEPTION 'ROLLBACK_BLOCKED_MANUAL_OPERATIONAL_ROWS_EXIST';
  END IF;
END $$;

BEGIN;
SET LOCAL lock_timeout = '20s';
ALTER TABLE public.revenue_os_programs ALTER COLUMN compilation_run_id SET NOT NULL;
ALTER TABLE public.revenue_os_programs ALTER COLUMN strategy_id SET NOT NULL;
COMMIT;

BEGIN;
SET LOCAL lock_timeout = '20s';
ALTER TABLE public.revenue_os_missions ALTER COLUMN compilation_run_id SET NOT NULL;
ALTER TABLE public.revenue_os_missions ALTER COLUMN strategy_id SET NOT NULL;
COMMIT;

BEGIN;
SET LOCAL lock_timeout = '20s';
ALTER TABLE public.revenue_os_mission_tasks ALTER COLUMN compilation_run_id SET NOT NULL;
ALTER TABLE public.revenue_os_mission_tasks ALTER COLUMN strategy_id SET NOT NULL;
COMMIT;

BEGIN;
UPDATE public.revenue_os_installations i
SET
  release_code = b.row_payload->>'release_code',
  module_version = b.row_payload->>'module_version',
  execution_mode = b.row_payload->>'execution_mode',
  contract_locked = coalesce((b.row_payload->>'contract_locked')::boolean, false),
  external_actions_enabled = coalesce((b.row_payload->>'external_actions_enabled')::boolean, true),
  metadata = coalesce(b.row_payload->'metadata', '{}'::jsonb),
  updated_at = timezone('utc', now())
FROM public.revenue_os_operational_depth_backups b
WHERE b.migration_code = 'AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE'
  AND b.table_name = 'revenue_os_installations'
  AND b.row_key = 'revenue-command-os'
  AND i.installation_key = b.row_key;
COMMIT;

DROP TABLE IF EXISTS public.revenue_os_outcome_records;
DROP TABLE IF EXISTS public.revenue_os_saved_views;
DROP TABLE IF EXISTS public.revenue_os_entity_notes;
DROP TABLE IF EXISTS public.revenue_os_entity_relations;
DROP TABLE IF EXISTS public.revenue_os_operational_depth_backups;

SELECT 'OPERATIONAL_DEPTH_ROLLBACK_COMPLETED' AS result;
