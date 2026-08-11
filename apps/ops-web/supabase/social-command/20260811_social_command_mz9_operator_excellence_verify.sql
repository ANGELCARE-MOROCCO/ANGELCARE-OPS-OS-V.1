-- ANGELCARE SOCIAL COMMAND MZ9 · SUMMIT VERIFY
select to_regclass('public.social_command_saved_views') is not null as saved_views_table;
select to_regclass('public.social_command_operator_preferences') is not null as operator_preferences_table;
select exists(select 1 from pg_indexes where schemaname='public' and indexname='social_command_saved_views_actor_idx') as saved_views_actor_index;
select exists(select 1 from pg_indexes where schemaname='public' and indexname='social_command_saved_views_shared_idx') as saved_views_shared_index;
select relrowsecurity from pg_class where oid='public.social_command_saved_views'::regclass;
select relrowsecurity from pg_class where oid='public.social_command_operator_preferences'::regclass;
select has_table_privilege('anon','public.social_command_saved_views','select') = false as anon_saved_views_blocked;
select has_table_privilege('authenticated','public.social_command_saved_views','select') = false as authenticated_saved_views_blocked;
