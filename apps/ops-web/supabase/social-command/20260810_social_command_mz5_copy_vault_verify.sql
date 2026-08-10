-- ANGELCARE SOCIAL COMMAND MZ5 · COPY VAULT VERIFY
select 'social_command_copy_categories' as object_name, to_regclass('public.social_command_copy_categories') is not null as ready
union all select 'social_command_copy_items', to_regclass('public.social_command_copy_items') is not null
union all select 'social_command_copy_versions', to_regclass('public.social_command_copy_versions') is not null
union all select 'social_command_copy_category_links', to_regclass('public.social_command_copy_category_links') is not null
union all select 'social_command_copy_approval_events', to_regclass('public.social_command_copy_approval_events') is not null
union all select 'social_command_copy_usage_events', to_regclass('public.social_command_copy_usage_events') is not null
union all select 'social_command_copy_import_jobs', to_regclass('public.social_command_copy_import_jobs') is not null
union all select 'social_command_copy_import_rows', to_regclass('public.social_command_copy_import_rows') is not null;

select
  (select count(*) from public.social_command_copy_items) as items,
  (select count(*) from public.social_command_copy_versions where status='approved') as approved_versions,
  (select count(*) from public.social_command_copy_categories where status='active') as active_categories,
  (select count(*) from public.social_command_copy_usage_events) as usage_events,
  (select coalesce(sum(skipped_duplicate_count),0) from public.social_command_copy_import_jobs) as skipped_duplicates;

-- Security boundary: every Copy Vault table must have RLS enabled.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in (
    'social_command_copy_categories','social_command_copy_items','social_command_copy_versions',
    'social_command_copy_category_links','social_command_copy_approval_events','social_command_copy_usage_events',
    'social_command_copy_import_jobs','social_command_copy_import_rows'
  )
order by c.relname;

-- Trigger evidence for canonical usage rollup.
select
  to_regprocedure('public.social_command_copy_usage_rollup()') is not null as usage_rollup_function_ready,
  exists(
    select 1 from pg_trigger
    where tgname='social_command_copy_usage_rollup_trg' and not tgisinternal
  ) as usage_rollup_trigger_ready;
