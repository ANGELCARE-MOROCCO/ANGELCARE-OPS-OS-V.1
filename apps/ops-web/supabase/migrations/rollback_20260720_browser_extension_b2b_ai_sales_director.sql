begin;
update public.browser_extension_release_channels
set version='0.5.0', release_notes='Rollback from Mega ZIP 6 to Mega ZIP 5', updated_at=now()
where channel_key='pilot';
drop table if exists public.browser_extension_b2b_ai_policy_versions cascade;
drop table if exists public.browser_extension_b2b_automation_kill_switches cascade;
drop table if exists public.browser_extension_b2b_automation_runs cascade;
drop table if exists public.browser_extension_b2b_automation_approvals cascade;
drop table if exists public.browser_extension_b2b_automation_definitions cascade;
drop table if exists public.browser_extension_b2b_executive_reports cascade;
drop table if exists public.browser_extension_b2b_territory_intelligence_snapshots cascade;
drop table if exists public.browser_extension_b2b_coaching_missions cascade;
drop table if exists public.browser_extension_b2b_execution_quality_patterns cascade;
drop table if exists public.browser_extension_b2b_execution_quality_assessments cascade;
drop table if exists public.browser_extension_b2b_management_interventions cascade;
drop table if exists public.browser_extension_b2b_revenue_risks cascade;
drop table if exists public.browser_extension_b2b_forecast_overrides cascade;
drop table if exists public.browser_extension_b2b_forecast_snapshots cascade;
drop table if exists public.browser_extension_b2b_pipeline_truth_assessments cascade;
drop table if exists public.browser_extension_b2b_ai_recommendation_evidence cascade;
drop table if exists public.browser_extension_b2b_ai_recommendations cascade;
commit;
