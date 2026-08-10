-- ANGELCARE SOCIAL COMMAND MZ5 · COPY VAULT ROLLBACK
-- Destructive. Run only when intentionally removing the MZ5 Copy Vault schema.
begin;
drop trigger if exists social_command_copy_usage_rollup_trg on public.social_command_copy_usage_events;
drop function if exists public.social_command_copy_usage_rollup();
drop table if exists public.social_command_copy_import_rows cascade;
drop table if exists public.social_command_copy_import_jobs cascade;
drop table if exists public.social_command_copy_usage_events cascade;
drop table if exists public.social_command_copy_approval_events cascade;
drop table if exists public.social_command_copy_category_links cascade;
drop table if exists public.social_command_copy_versions cascade;
drop table if exists public.social_command_copy_items cascade;
drop table if exists public.social_command_copy_categories cascade;
commit;
