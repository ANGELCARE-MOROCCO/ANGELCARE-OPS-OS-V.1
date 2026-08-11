-- ANGELCARE SOCIAL COMMAND MZ8 · PRODUCT CLOSURE PRECHECK
-- READ-ONLY. No mutation. Run before MZ8 migration.
do $$
declare t text;
begin
  foreach t in array array[
    'social_command_media_assets','social_command_media_tags','social_command_media_asset_tags','social_command_media_usage',
    'social_command_campaigns','social_command_publications','social_command_publication_media','social_command_audit_events',
    'social_command_copy_items','social_command_copy_versions','social_command_copy_categories',
    'social_command_copy_category_links','social_command_copy_approval_events','social_command_copy_usage_events'
  ] loop
    if to_regclass('public.'||t) is null then raise exception 'MZ8 precheck: required table % is missing',t; end if;
  end loop;
end $$;
select 'MZ8 PRECHECK PASS' as result;
