begin;

drop function if exists public.browser_extension_ultra_enqueue_due_schedules();
drop function if exists public.browser_extension_ultra_bridge_dry_run(uuid);
drop function if exists public.browser_extension_ultra_claim_jobs(text,integer);
drop function if exists public.browser_extension_ultra_normalize(text);

drop table if exists public.browser_extension_ultra_job_runs cascade;
drop table if exists public.browser_extension_ultra_scheduler_control cascade;
drop table if exists public.browser_extension_ultra_jobs cascade;
drop table if exists public.browser_extension_ultra_schedules cascade;
drop table if exists public.browser_extension_ultra_reports cascade;
drop table if exists public.browser_extension_ultra_ai_runs cascade;
drop table if exists public.browser_extension_ultra_data_quality_history cascade;
drop table if exists public.browser_extension_ultra_data_quality_issues cascade;
drop table if exists public.browser_extension_ultra_contexts cascade;
drop table if exists public.browser_extension_ultra_bridge_conflicts cascade;
drop table if exists public.browser_extension_ultra_commercial_id_map cascade;
drop table if exists public.browser_extension_ultra_bridge_runs cascade;

commit;
