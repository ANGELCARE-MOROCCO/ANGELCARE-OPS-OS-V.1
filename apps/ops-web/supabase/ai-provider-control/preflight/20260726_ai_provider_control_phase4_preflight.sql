-- Phase 4 read-only preflight
with checks(name,present) as (
  values
    ('pgcrypto', exists(select 1 from pg_available_extensions where name='pgcrypto')),
    ('supabase_vault', exists(select 1 from pg_available_extensions where name='supabase_vault')),
    ('app_users', to_regclass('public.app_users') is not null),
    ('phase2_market_ai_commands', to_regclass('public.market_ai_commands') is not null),
    ('phase3_runtime', to_regclass('public.market_ai_runtime_jobs') is not null or to_regclass('public.market_ai_action_queue') is not null),
    ('market_os_records', to_regclass('public.market_os_records') is not null)
)
select name,present,case when bool_and(present) over() then 'READY' else 'BLOCKED' end as phase4_preflight
from checks order by name;
