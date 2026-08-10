-- ANGELCARE SOCIAL COMMAND MZ1 · PRECHECK
-- Read-only. Run before the migration.
with expected(name) as (
  values
    ('social_command_connections'),('social_command_channel_capabilities'),('social_command_oauth_sessions'),
    ('social_command_media_assets'),('social_command_media_tags'),('social_command_media_asset_tags'),('social_command_media_usage'),
    ('social_command_campaigns'),('social_command_campaign_items'),('social_command_publications'),('social_command_publication_variants'),
    ('social_command_publication_media'),('social_command_schedules'),('social_command_execution_jobs'),('social_command_execution_attempts'),
    ('social_command_provider_results'),('social_command_bulk_plans'),('social_command_bulk_slots'),('social_command_action_operations'),
    ('social_command_audit_events')
), found as (
  select table_name as name
  from information_schema.tables
  where table_schema='public' and table_name like 'social_command_%'
)
select
  case when (select count(*) from found)=0 then 'CLEAN_INSTALL'
       when not exists (select 1 from expected e left join found f using(name) where f.name is null)
        and not exists (select 1 from found f left join expected e using(name) where e.name is null)
         then 'ALREADY_COMPLETE'
       else 'PARTIAL_OR_DRIFTED'
  end as social_command_mz1_precheck,
  (select count(*) from expected) as expected_tables,
  (select count(*) from found) as found_social_command_tables,
  coalesce((select string_agg(e.name, ', ' order by e.name) from expected e left join found f using(name) where f.name is null),'') as missing_tables,
  coalesce((select string_agg(f.name, ', ' order by f.name) from found f left join expected e using(name) where e.name is null),'') as unexpected_tables;
