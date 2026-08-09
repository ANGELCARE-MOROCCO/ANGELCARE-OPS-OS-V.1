-- ANGELCARE SANILA Marketing Director AI Phase 2 — read-only cutover preflight
select current_database() as database_name, current_user as database_user, now() as checked_at;

with required_foundations(object_name, available) as (
  values
    ('pgcrypto extension', exists(select 1 from pg_extension where extname='pgcrypto')),
    ('app_users table', exists(select 1 from information_schema.tables where table_schema='public' and table_name='app_users')),
    ('app_sessions table', exists(select 1 from information_schema.tables where table_schema='public' and table_name='app_sessions'))
)
select * from required_foundations order by object_name;

select table_name
from information_schema.tables
where table_schema='public' and table_name like 'market_ai_%'
order by table_name;

select case
  when exists(select 1 from information_schema.tables where table_schema='public' and table_name='market_ai_commands')
    then 'EXISTING_SCHEMA_REVIEW_REQUIRED'
  when not exists(select 1 from information_schema.tables where table_schema='public' and table_name='app_users')
    then 'BLOCKED_MISSING_APP_USERS'
  when not exists(select 1 from information_schema.tables where table_schema='public' and table_name='app_sessions')
    then 'BLOCKED_MISSING_APP_SESSIONS'
  else 'READY'
end as cutover_gate;
