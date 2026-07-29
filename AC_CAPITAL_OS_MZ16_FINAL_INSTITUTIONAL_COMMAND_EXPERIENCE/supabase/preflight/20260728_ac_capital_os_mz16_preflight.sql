\pset pager off
select current_database(), current_user, now();

select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'ac_capital_ai_agents',
    'ac_capital_ai_agent_runs',
    'ai_provider_command_policies'
  )
order by table_name;

select
  p.oid::regprocedure as function_signature,
  p.proname
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and pg_get_functiondef(p.oid) ilike '%decision%'
  and (
    p.proname ilike '%provider%'
    or p.proname ilike '%govern%'
    or p.proname ilike '%policy%'
  )
order by p.proname;
