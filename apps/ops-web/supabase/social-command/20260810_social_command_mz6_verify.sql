-- ANGELCARE SOCIAL COMMAND MZ6 — VERIFY (READ ONLY)
select
  to_regclass('public.social_command_contact_profiles') is not null as contact_profiles_ready,
  coalesce((select relrowsecurity from pg_class where oid='public.social_command_contact_profiles'::regclass),false) as rls_enabled,
  exists(select 1 from pg_indexes where schemaname='public' and indexname='social_command_contact_profiles_username_idx') as username_index_ready,
  exists(select 1 from pg_indexes where schemaname='public' and indexname='social_command_contact_profiles_refresh_idx') as refresh_index_ready;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name='social_command_contact_profiles'
order by ordinal_position;
