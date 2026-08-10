-- ANGELCARE SOCIAL COMMAND MZ1 · READ-ONLY DATABASE VERIFIER
do $$
declare
  missing text;
  bad_rls text;
begin
  select string_agg(x.name, ', ' order by x.name) into missing
  from (values
    ('social_command_connections'),('social_command_channel_capabilities'),('social_command_oauth_sessions'),
    ('social_command_media_assets'),('social_command_media_tags'),('social_command_media_asset_tags'),('social_command_media_usage'),
    ('social_command_campaigns'),('social_command_campaign_items'),('social_command_publications'),('social_command_publication_variants'),
    ('social_command_publication_media'),('social_command_schedules'),('social_command_execution_jobs'),('social_command_execution_attempts'),
    ('social_command_provider_results'),('social_command_bulk_plans'),('social_command_bulk_slots'),('social_command_action_operations'),
    ('social_command_audit_events')
  ) x(name)
  where to_regclass('public.'||x.name) is null;
  if missing is not null then raise exception 'SOCIAL_COMMAND_MZ1_TABLES_MISSING: %', missing; end if;

  select string_agg(c.relname, ', ' order by c.relname) into bad_rls
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname like 'social_command_%' and c.relkind='r' and not c.relrowsecurity;
  if bad_rls is not null then raise exception 'SOCIAL_COMMAND_MZ1_RLS_DISABLED: %', bad_rls; end if;

  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_media_assets' and column_name in ('binary','blob','file_bytes','base64')) then
    raise exception 'SOCIAL_COMMAND_MZ1_MEDIA_BINARY_COLUMN_FORBIDDEN';
  end if;
end $$;

select
  'SOCIAL_COMMAND_MZ1_DATABASE_VERIFIED' as result,
  (select count(*) from information_schema.tables where table_schema='public' and table_name like 'social_command_%') as social_command_tables,
  (select count(*) from public.social_command_media_assets) as media_metadata_rows,
  (select count(*) from public.social_command_publications) as publications,
  (select count(*) from public.social_command_execution_jobs) as execution_jobs;
