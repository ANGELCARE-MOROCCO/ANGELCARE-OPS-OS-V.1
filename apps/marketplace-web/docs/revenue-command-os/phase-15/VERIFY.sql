SELECT installation_key,release_code,module_version,execution_mode,contract_locked,external_actions_enabled,
 metadata->>'currentPhase' AS current_phase,metadata->>'premiumCockpit' AS premium_cockpit,metadata->>'coreZones' AS core_zones
FROM public.revenue_os_installations WHERE installation_key='revenue-command-os';
SELECT count(*) AS cockpit_tables FROM information_schema.tables WHERE table_schema='public' AND table_name IN (
'revenue_os_cockpit_views','revenue_os_cockpit_preferences','revenue_os_cockpit_snapshots','revenue_os_executive_briefs','revenue_os_executive_brief_versions','revenue_os_cockpit_exceptions','revenue_os_cockpit_interventions','revenue_os_cockpit_intervention_actions','revenue_os_cockpit_alerts','revenue_os_cockpit_acknowledgements','revenue_os_cockpit_saved_filters','revenue_os_cockpit_layouts','revenue_os_cockpit_watchlists','revenue_os_cockpit_digest_runs','revenue_os_cockpit_audit_events');
SELECT count(*) AS cockpit_permissions FROM public.revenue_os_permission_registry WHERE phase_introduced=15 AND active=true;
SELECT workspace_key,label,href,permission_key,maturity_status FROM public.revenue_os_workspaces WHERE workspace_key='strategic-view';
SELECT count(*) FILTER(WHERE external_action=true AND status='succeeded') AS external_actions_executed FROM public.revenue_os_execution_actions;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code='AC-REVENUE-OS-MZ15-PREMIUM-COCKPIT' AND execution_mode='approval-gated' AND external_actions_enabled=false) THEN RAISE EXCEPTION 'MZ15 registry verification failed'; END IF;
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('revenue_os_cockpit_views','revenue_os_cockpit_preferences','revenue_os_cockpit_snapshots','revenue_os_executive_briefs','revenue_os_executive_brief_versions','revenue_os_cockpit_exceptions','revenue_os_cockpit_interventions','revenue_os_cockpit_intervention_actions','revenue_os_cockpit_alerts','revenue_os_cockpit_acknowledgements','revenue_os_cockpit_saved_filters','revenue_os_cockpit_layouts','revenue_os_cockpit_watchlists','revenue_os_cockpit_digest_runs','revenue_os_cockpit_audit_events'))<>15 THEN RAISE EXCEPTION 'MZ15 cockpit table verification failed'; END IF;
 IF (SELECT count(*) FROM public.revenue_os_permission_registry WHERE phase_introduced=15 AND active=true)<11 THEN RAISE EXCEPTION 'MZ15 permission verification failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_execution_actions WHERE external_action=true AND status='succeeded') THEN RAISE EXCEPTION 'MZ15 verification expected zero external actions'; END IF;
END $$;
