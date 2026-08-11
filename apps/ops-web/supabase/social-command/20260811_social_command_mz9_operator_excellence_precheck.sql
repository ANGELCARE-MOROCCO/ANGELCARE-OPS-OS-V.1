-- ANGELCARE SOCIAL COMMAND MZ9 · SUMMIT PRECHECK
select to_regclass('public.social_command_execution_jobs') is not null as execution_jobs_present;
select to_regclass('public.social_command_execution_attempts') is not null as execution_attempts_present;
select to_regclass('public.social_command_provider_results') is not null as provider_results_present;
select to_regclass('public.social_command_media_assets') is not null as media_assets_present;
select to_regclass('public.social_command_copy_items') is not null as copy_vault_present;
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_media_assets' and column_name='lifecycle_status') as mz8_media_lifecycle_present;
