-- ANGELCARE SOCIAL COMMAND MZ1 · DESTRUCTIVE ROLLBACK
-- USE ONLY FOR AN INTENTIONAL FULL MZ1 UNINSTALL. Existing Social Command data will be destroyed.
begin;
drop table if exists public.social_command_provider_results cascade;
drop table if exists public.social_command_execution_attempts cascade;
drop table if exists public.social_command_execution_jobs cascade;
drop table if exists public.social_command_schedules cascade;
drop table if exists public.social_command_bulk_slots cascade;
drop table if exists public.social_command_bulk_plans cascade;
drop table if exists public.social_command_publication_media cascade;
drop table if exists public.social_command_publication_variants cascade;
drop table if exists public.social_command_campaign_items cascade;
drop table if exists public.social_command_publications cascade;
drop table if exists public.social_command_media_usage cascade;
drop table if exists public.social_command_media_asset_tags cascade;
drop table if exists public.social_command_media_tags cascade;
drop table if exists public.social_command_media_assets cascade;
drop table if exists public.social_command_campaigns cascade;
drop table if exists public.social_command_oauth_sessions cascade;
drop table if exists public.social_command_channel_capabilities cascade;
drop table if exists public.social_command_connections cascade;
drop table if exists public.social_command_action_operations cascade;
drop table if exists public.social_command_audit_events cascade;
drop function if exists public.social_command_refresh_media_usage_count();
commit;
select 'SOCIAL_COMMAND_MZ1_DATABASE_ROLLED_BACK' as result;
