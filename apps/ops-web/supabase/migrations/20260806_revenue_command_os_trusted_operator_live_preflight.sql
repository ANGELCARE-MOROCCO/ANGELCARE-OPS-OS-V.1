SELECT
  to_regclass('public.revenue_os_installations') AS installations,
  to_regclass('public.revenue_os_execution_actions') AS execution_actions,
  to_regclass('public.revenue_os_execution_outbox') AS execution_outbox,
  to_regclass('public.revenue_os_command_definitions') AS command_definitions,
  to_regclass('public.revenue_os_programs') AS programs,
  to_regclass('public.revenue_os_missions') AS missions,
  to_regclass('public.revenue_os_mission_tasks') AS mission_tasks;

SELECT installation_key,execution_mode,contract_locked,external_actions_enabled,release_code,module_version
FROM public.revenue_os_installations WHERE installation_key='revenue-command-os';

SELECT execution_mode,count(*) FROM public.revenue_os_objectives GROUP BY execution_mode;
SELECT execution_mode,count(*) FROM public.revenue_os_propagation_runs GROUP BY execution_mode;
SELECT execution_mode,approval_required,count(*) FROM public.revenue_os_execution_actions GROUP BY execution_mode,approval_required;
SELECT status,approval_class,count(*) FROM public.revenue_os_command_definitions GROUP BY status,approval_class ORDER BY count(*) DESC;
