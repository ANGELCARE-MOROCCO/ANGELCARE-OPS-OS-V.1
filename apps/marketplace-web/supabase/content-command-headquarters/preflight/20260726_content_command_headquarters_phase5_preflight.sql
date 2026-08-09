-- Read-only preflight for ANGELCARE Content Command Headquarters Phase 5.
with foundations(name,present) as (
 values
 ('pgcrypto',exists(select 1 from pg_extension where extname='pgcrypto')),
 ('app_users',to_regclass('public.app_users') is not null),
 ('app_sessions',to_regclass('public.app_sessions') is not null),
 ('phase1_content_server_records',to_regclass('public.market_os_content_records') is not null or to_regclass('public.market_os_records') is not null),
 ('phase2_ai_commands',to_regclass('public.market_ai_commands') is not null),
 ('phase2_ai_skills',to_regclass('public.market_ai_skills') is not null),
 ('phase3_action_queue',to_regclass('public.market_ai_action_queue') is not null),
 ('phase3_canonical_records',to_regclass('public.market_os_records') is not null),
 ('phase4_provider_assignments',to_regclass('public.ai_provider_module_assignments') is not null)
)
select name,present,case when bool_and(present) over() then 'READY' else 'REVIEW_REQUIRED' end as phase5_gate from foundations order by name;

select table_name from information_schema.tables where table_schema='public' and table_name like 'market_content_%' order by table_name;
