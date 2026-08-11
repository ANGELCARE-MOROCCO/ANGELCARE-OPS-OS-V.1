-- ANGELCARE SOCIAL COMMAND MZ8 · VERIFICATION
with required_tables(name) as (values
 ('social_command_media_categories'),('social_command_media_category_links'),('social_command_media_collections'),
 ('social_command_media_collection_items'),('social_command_media_tombstones'),('social_command_copy_tombstones')
), table_check as (
 select r.name, to_regclass('public.'||r.name) is not null as ok from required_tables r
), required_columns(table_name,column_name) as (values
 ('social_command_media_assets','title'),('social_command_media_assets','description'),('social_command_media_assets','lifecycle_status'),
 ('social_command_media_assets','favorite'),('social_command_media_assets','updated_by'),('social_command_media_assets','updated_at')
), column_check as (
 select r.table_name,r.column_name,exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=r.table_name and c.column_name=r.column_name) as ok from required_columns r
)
select 'table' as kind,name as object,ok from table_check
union all
select 'column',table_name||'.'||column_name,ok from column_check
order by kind,object;

select
  (select count(*) from public.social_command_media_assets where lifecycle_status not in ('active','archived','trashed'))=0 as media_lifecycle_valid,
  (select count(*) from public.social_command_copy_items where lifecycle_status not in ('active','archived','trashed'))=0 as copy_lifecycle_valid,
  (select count(*) from public.social_command_copy_categories where status not in ('active','archived','trashed'))=0 as copy_category_lifecycle_valid;
