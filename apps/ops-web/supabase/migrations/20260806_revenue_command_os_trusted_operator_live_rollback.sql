BEGIN;
-- Exact installation record restoration from the migration backup.
DO $$
DECLARE snapshot jsonb;
BEGIN
 SELECT row_payload INTO snapshot FROM public.revenue_os_live_activation_backups
 WHERE migration_code='AC-RCOS-TRUSTED-OPERATOR-LIVE-2026.08' AND table_name='revenue_os_installations' AND row_key='revenue-command-os'
 ORDER BY captured_at DESC LIMIT 1;
 IF snapshot IS NOT NULL THEN
  UPDATE public.revenue_os_installations SET
    contract_version=snapshot->>'contract_version', release_code=snapshot->>'release_code', module_version=snapshot->>'module_version',
    environment=snapshot->>'environment', execution_mode=snapshot->>'execution_mode', contract_locked=(snapshot->>'contract_locked')::boolean,
    external_actions_enabled=(snapshot->>'external_actions_enabled')::boolean, metadata=coalesce(snapshot->'metadata','{}'::jsonb), updated_at=now()
  WHERE installation_key='revenue-command-os';
 END IF;
END $$;
DROP TRIGGER IF EXISTS revenue_os_execution_actions_live_integrity_guard ON public.revenue_os_execution_actions;
DROP FUNCTION IF EXISTS public.revenue_os_live_action_integrity_guard();
-- Operational exceptions are intentionally retained as business evidence. Drop manually only when empty and explicitly approved by an operator.
COMMIT;
